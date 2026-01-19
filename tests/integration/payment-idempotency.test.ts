import { describe, it, expect, vi, beforeEach } from 'vitest';


/**
 * Test Suite: Payment Idempotency and PENDING Status
 * 
 * Verifies that:
 * 1. Duplicate payments with same idempotency key return existing transaction
 * 2. New transactions are created with PENDING status (not COMPLETED)
 * 3. Payment descriptions are sanitized via DOMPurify
 * 
 * Security Issue: Without idempotency, duplicate payment requests could charge users multiple times.
 * Without PENDING status, transactions could be marked complete before payment provider confirms.
 */

// Set required env vars
process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-chars-long';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        transaction: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn(),
    ensureAuthResponse: vi.fn(),
}));

vi.mock('@/lib/sanitize', () => ({
    sanitizeText: vi.fn((text) => text.trim().replace(/<[^>]*>/g, '')),
}));

describe('Payment Idempotency and PENDING Status', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return existing transaction when idempotency key already exists', async () => {
        const { prisma } = await import('@/lib/prisma');
        const { ensureRateLimit, ensureAuthResponse } = await import('@/lib/api-security');

        // Mock auth and rate limiting
        vi.mocked(ensureRateLimit).mockResolvedValue(null);
        vi.mocked(ensureAuthResponse).mockResolvedValue({
            session: {
                user: { id: 'sender-123', email: 'sender@example.com' },
            },
        } as any);

        // Mock existing transaction with idempotency key
        const existingTransaction = {
            id: 'txn-existing',
            amount: 100,
            serviceFee: 2.5,
            netAmount: 97.5,
            currency: 'USD',
            provider: 'CARD',
            status: 'PENDING',
            description: 'Original payment',
            idempotencyKey: 'unique-key-123',
            senderId: 'sender-123',
            receiverId: 'recipient-456',
            createdAt: new Date('2024-01-01'),
        };

        vi.mocked(prisma.transaction.findUnique).mockResolvedValue(existingTransaction as any);

        // Import the route handler
        const { POST } = await import('@/app/api/payments/send/route');

        const request = new Request('http://localhost/api/payments/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                recipientId: 'recipient-456',
                recipientName: 'Jane Doe',
                provider: 'CARD',
                idempotencyKey: 'unique-key-123', // Same key
                description: 'Second attempt',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        // Should return the existing transaction
        expect(data.id).toBe('txn-existing');
        expect(data.description).toBe('Original payment');

        // Create should NOT be called
        expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('should create new transaction with PENDING status', async () => {
        const { prisma } = await import('@/lib/prisma');
        const { ensureRateLimit, ensureAuthResponse } = await import('@/lib/api-security');

        vi.mocked(ensureRateLimit).mockResolvedValue(null);
        vi.mocked(ensureAuthResponse).mockResolvedValue({
            session: {
                user: { id: 'sender-123', email: 'sender@example.com' },
            },
        } as any);

        // No existing transaction
        vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);

        // Recipient exists
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'recipient-456',
        } as any);

        // Mock transaction creation
        const newTransaction = {
            id: 'txn-new',
            amount: 100,
            serviceFee: 2.5,
            netAmount: 97.5,
            currency: 'USD',
            provider: 'PAYPAL',
            status: 'PENDING', // Critical: must be PENDING
            description: 'Test payment',
            idempotencyKey: 'new-key-456',
            senderId: 'sender-123',
            receiverId: 'recipient-456',
            createdAt: new Date(),
        };

        vi.mocked(prisma.transaction.create).mockResolvedValue(newTransaction as any);

        const { POST } = await import('@/app/api/payments/send/route');

        const request = new Request('http://localhost/api/payments/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                recipientId: 'recipient-456',
                recipientName: 'Jane Doe',
                provider: 'PAYPAL',
                idempotencyKey: 'new-key-456',
                description: 'Test payment',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        // Verify transaction created with PENDING status
        expect(prisma.transaction.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                status: 'PENDING', // NOT 'COMPLETED'
                idempotencyKey: 'new-key-456',
            }),
        });

        expect(data.status).toBe('PENDING');
        expect(data.id).toBe('txn-new');
    });

    it('should create separate transactions for different idempotency keys', async () => {
        const { prisma } = await import('@/lib/prisma');
        const { ensureRateLimit, ensureAuthResponse } = await import('@/lib/api-security');

        vi.mocked(ensureRateLimit).mockResolvedValue(null);
        vi.mocked(ensureAuthResponse).mockResolvedValue({
            session: {
                user: { id: 'sender-123', email: 'sender@example.com' },
            },
        } as any);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'recipient-456',
        } as any);

        const { POST } = await import('@/app/api/payments/send/route');

        // First payment
        vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.transaction.create).mockResolvedValue({
            id: 'txn-1',
            status: 'PENDING',
            idempotencyKey: 'key-1',
        } as any);

        const request1 = new Request('http://localhost/api/payments/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                recipientId: 'recipient-456',
                recipientName: 'Jane Doe',
                provider: 'CARD',
                idempotencyKey: 'key-1',
            }),
        });

        await POST(request1);

        // Second payment with different key
        vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.transaction.create).mockResolvedValue({
            id: 'txn-2',
            status: 'PENDING',
            idempotencyKey: 'key-2',
        } as any);

        const request2 = new Request('http://localhost/api/payments/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                recipientId: 'recipient-456',
                recipientName: 'Jane Doe',
                provider: 'CARD',
                idempotencyKey: 'key-2', // Different key
            }),
        });

        await POST(request2);

        // Both should be created
        expect(prisma.transaction.create).toHaveBeenCalledTimes(2);
    });

    it('should sanitize payment description to prevent XSS', async () => {
        const { prisma } = await import('@/lib/prisma');
        const { ensureRateLimit, ensureAuthResponse } = await import('@/lib/api-security');
        const { sanitizeText } = await import('@/lib/sanitize');

        vi.mocked(ensureRateLimit).mockResolvedValue(null);
        vi.mocked(ensureAuthResponse).mockResolvedValue({
            session: {
                user: { id: 'sender-123', email: 'sender@example.com' },
            },
        } as any);

        vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'recipient-456',
        } as any);

        vi.mocked(prisma.transaction.create).mockResolvedValue({
            id: 'txn-sanitized',
            status: 'PENDING',
        } as any);

        const { POST } = await import('@/app/api/payments/send/route');

        const request = new Request('http://localhost/api/payments/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 50,
                recipientId: 'recipient-456',
                recipientName: 'Jane Doe',
                provider: 'CRYPTO',
                idempotencyKey: 'safe-key',
                description: '<script>alert("xss")</script>Payment for services',
            }),
        });

        await POST(request);

        // Verify sanitizeText was called
        expect(sanitizeText).toHaveBeenCalledWith(
            '<script>alert("xss")</script>Payment for services'
        );
    });

    it('should prevent self-payment', async () => {
        const { prisma } = await import('@/lib/prisma');
        const { ensureRateLimit, ensureAuthResponse } = await import('@/lib/api-security');

        vi.mocked(ensureRateLimit).mockResolvedValue(null);
        vi.mocked(ensureAuthResponse).mockResolvedValue({
            session: {
                user: { id: 'user-123', email: 'user@example.com' },
            },
        } as any);

        vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'user-123', // Same as sender
        } as any);

        const { POST } = await import('@/app/api/payments/send/route');

        const request = new Request('http://localhost/api/payments/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                recipientId: 'user-123', // Same as sender
                recipientName: 'Self',
                provider: 'CARD',
                idempotencyKey: 'self-pay-key',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Cannot send payment to yourself');
        expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('should require idempotency key via schema validation', async () => {
        const { paymentSchema } = await import('@/lib/validations');

        // Test missing idempotency key
        const result = paymentSchema.safeParse({
            amount: 100,
            recipientId: 'recipient-456',
            recipientName: 'Jane Doe',
            provider: 'CARD',
            // idempotencyKey missing
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const idempotencyError = result.error.issues.find(
                (issue) => issue.path[0] === 'idempotencyKey'
            );
            expect(idempotencyError).toBeDefined();
        }
    });
});
