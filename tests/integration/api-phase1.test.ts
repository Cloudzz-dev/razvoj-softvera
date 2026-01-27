import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as healthGet } from '@/app/api/health/route';
import { POST as verifyEmailPost } from '@/app/api/verify-email/route';
import { POST as resendVerificationPost } from '@/app/api/resend-verification/route';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        verificationToken: {
            findFirst: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            create: vi.fn(),
        },
        user: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
}));

vi.mock('@/lib/email', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    generateVerificationCode: vi.fn().mockReturnValue('123456'),
}));

describe('Phase 1 API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/health', () => {
        it('should return healthy status', async () => {
            const response = await healthGet(new Request("http://localhost/api/health"));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.status).toBe('healthy');
            expect(data.timestamp).toBeDefined();
            expect(data.uptime).toBeDefined();
        });
    });

    describe('POST /api/verify-email', () => {
        it('should return 400 if email or code is missing', async () => {
            const req = new Request('http://localhost/api/verify-email', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const response = await verifyEmailPost(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Email and code are required');
        });

        it('should return 400 if token is invalid', async () => {
            const { prisma } = await import('@/lib/prisma');
            vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

            const req = new Request('http://localhost/api/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
            });
            const response = await verifyEmailPost(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid verification code');
        });

        it('should return 400 if token is expired', async () => {
            const { prisma } = await import('@/lib/prisma');
            vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
                identifier: 'test@example.com',
                token: '123456',
                expires: new Date(Date.now() - 10000), // Expired
            } as any);

            const req = new Request('http://localhost/api/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
            });
            const response = await verifyEmailPost(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('expired');
        });

        it('should verify user successfully', async () => {
            const { prisma } = await import('@/lib/prisma');
            vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
                identifier: 'test@example.com',
                token: '123456',
                expires: new Date(Date.now() + 10000), // Valid
            } as any);

            vi.mocked(prisma.user.update).mockResolvedValue({
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: new Date(),
            } as any);

            const req = new Request('http://localhost/api/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
            });
            const response = await verifyEmailPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.user.update).toHaveBeenCalled();
            expect(prisma.verificationToken.delete).toHaveBeenCalled();
        });
    });

    describe('POST /api/resend-verification', () => {
        it('should return 400 if email is missing', async () => {
            const req = new Request('http://localhost/api/resend-verification', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const response = await resendVerificationPost(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Email is required');
        });

        it('should return success even if user not found (security)', async () => {
            const { prisma } = await import('@/lib/prisma');
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: 'unknown@example.com' }),
            });
            const response = await resendVerificationPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });

        it('should return 400 if already verified', async () => {
            const { prisma } = await import('@/lib/prisma');
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                email: 'test@example.com',
                emailVerified: new Date(),
            } as any);

            const req = new Request('http://localhost/api/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com' }),
            });
            const response = await resendVerificationPost(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Email is already verified');
        });

        it('should send verification email successfully', async () => {
            const { prisma } = await import('@/lib/prisma');
            const { sendVerificationEmail } = await import('@/lib/email');

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: null,
            } as any);

            const req = new Request('http://localhost/api/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com' }),
            });
            const response = await resendVerificationPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.verificationToken.deleteMany).toHaveBeenCalled();
            expect(prisma.verificationToken.create).toHaveBeenCalled();
            expect(sendVerificationEmail).toHaveBeenCalled();
        });
    });
});
