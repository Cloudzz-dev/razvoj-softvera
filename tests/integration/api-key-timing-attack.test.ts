import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test Suite: Timing Attack Mitigation - API Key Authentication
 * 
 * Verifies that the API key authentication implementation prevents timing attacks
 * by checking ALL potential key matches, not exiting early when a valid key is found.
 * 
 * Security Issue: Timing attacks can reveal information about which keys are valid
 * by measuring response times. Early exit on first match creates timing differences.
 */

// Set required env vars before imports
process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-chars-long';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        apiKey: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/api-key-utils', () => ({
    extractKeyPrefix: vi.fn(),
    verifyApiKey: vi.fn(),
    isValidApiKeyFormat: vi.fn(),
}));

describe('Timing Attack Mitigation - API Key Auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should verify ALL potential keys even when first key is valid', async () => {
        const { authenticateApiKey } = await import('@/lib/api-key-auth');
        const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
        vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');

        // Mock THREE potential keys with the same prefix
        vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
            {
                id: 'key-1',
                keyHash: 'hash1',
                userId: 'user-1',
                permissions: ['read'],
                expiresAt: null,
            },
            {
                id: 'key-2',
                keyHash: 'hash2',
                userId: 'user-2',
                permissions: ['write'],
                expiresAt: null,
            },
            {
                id: 'key-3',
                keyHash: 'hash3',
                userId: 'user-3',
                permissions: ['admin'],
                expiresAt: null,
            },
        ] as any);

        // Make the FIRST key valid, but others invalid
        vi.mocked(verifyApiKey)
            .mockResolvedValueOnce(true)  // key-1 is valid
            .mockResolvedValueOnce(false) // key-2 is invalid
            .mockResolvedValueOnce(false); // key-3 is invalid

        vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

        const request = new Request('http://localhost/api/test', {
            headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
        });

        const result = await authenticateApiKey(request);

        // CRITICAL: verifyApiKey should be called 3 times, once for each key
        // Even though the first key was valid, all keys must be checked
        expect(verifyApiKey).toHaveBeenCalledTimes(3);

        expect(result.authenticated).toBe(true);
        expect(result.userId).toBe('user-1');
    });

    it('should verify ALL potential keys even when middle key is valid', async () => {
        const { authenticateApiKey } = await import('@/lib/api-key-auth');
        const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
        vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');

        vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
            {
                id: 'key-1',
                keyHash: 'hash1',
                userId: 'user-1',
                permissions: ['read'],
                expiresAt: null,
            },
            {
                id: 'key-2',
                keyHash: 'hash2',
                userId: 'user-2',
                permissions: ['write'],
                expiresAt: null,
            },
            {
                id: 'key-3',
                keyHash: 'hash3',
                userId: 'user-3',
                permissions: ['admin'],
                expiresAt: null,
            },
        ] as any);

        // Make the SECOND key valid
        vi.mocked(verifyApiKey)
            .mockResolvedValueOnce(false) // key-1 is invalid
            .mockResolvedValueOnce(true)  // key-2 is valid
            .mockResolvedValueOnce(false); // key-3 is invalid

        vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

        const request = new Request('http://localhost/api/test', {
            headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
        });

        const result = await authenticateApiKey(request);

        // All 3 keys should be verified, no early exit
        expect(verifyApiKey).toHaveBeenCalledTimes(3);

        expect(result.authenticated).toBe(true);
        expect(result.userId).toBe('user-2');
    });

    it('should verify ALL keys when none are valid', async () => {
        const { authenticateApiKey } = await import('@/lib/api-key-auth');
        const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
        vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');

        vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
            {
                id: 'key-1',
                keyHash: 'hash1',
                userId: 'user-1',
                permissions: ['read'],
                expiresAt: null,
            },
            {
                id: 'key-2',
                keyHash: 'hash2',
                userId: 'user-2',
                permissions: ['write'],
                expiresAt: null,
            },
        ] as any);

        // All keys are invalid
        vi.mocked(verifyApiKey).mockResolvedValue(false);

        const request = new Request('http://localhost/api/test', {
            headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
        });

        const result = await authenticateApiKey(request);

        // Both keys should be verified
        expect(verifyApiKey).toHaveBeenCalledTimes(2);

        expect(result.authenticated).toBe(false);
        expect(result.error).toBe('Invalid API key');
    });

    it('should handle expired keys but still check all remaining keys', async () => {
        const { authenticateApiKey } = await import('@/lib/api-key-auth');
        const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
        vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');

        vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
            {
                id: 'key-1',
                keyHash: 'hash1',
                userId: 'user-1',
                permissions: ['read'],
                expiresAt: new Date('2020-01-01'), // Expired
            },
            {
                id: 'key-2',
                keyHash: 'hash2',
                userId: 'user-2',
                permissions: ['write'],
                expiresAt: null, // Valid
            },
        ] as any);

        // Second key is valid
        vi.mocked(verifyApiKey)
            .mockResolvedValueOnce(true)  // key-1 (but it's expired)
            .mockResolvedValueOnce(true); // key-2 (valid)

        vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

        const request = new Request('http://localhost/api/test', {
            headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
        });

        const result = await authenticateApiKey(request);

        // Both keys should be checked (even though first is expired)
        expect(verifyApiKey).toHaveBeenCalledTimes(2);

        // Should authenticate with the second key
        expect(result.authenticated).toBe(true);
        expect(result.userId).toBe('user-2');
    });

    it('should only store the first valid key when multiple keys are valid', async () => {
        const { authenticateApiKey } = await import('@/lib/api-key-auth');
        const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
        vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');

        vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
            {
                id: 'key-1',
                keyHash: 'hash1',
                userId: 'user-1',
                permissions: ['read'],
                expiresAt: null,
            },
            {
                id: 'key-2',
                keyHash: 'hash2',
                userId: 'user-2',
                permissions: ['write'],
                expiresAt: null,
            },
        ] as any);

        // BOTH keys are valid (edge case)
        vi.mocked(verifyApiKey).mockResolvedValue(true);

        vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

        const request = new Request('http://localhost/api/test', {
            headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
        });

        const result = await authenticateApiKey(request);

        // Both keys should be verified
        expect(verifyApiKey).toHaveBeenCalledTimes(2);

        // Should use the first valid key (key-1)
        expect(result.authenticated).toBe(true);
        expect(result.userId).toBe('user-1');
    });
});
