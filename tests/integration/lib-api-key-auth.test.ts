import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Set required env vars before imports
process.env.NEXTAUTH_SECRET = 'test-secret';

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

describe('lib/api-key-auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('authenticateApiKey', () => {
        it('should return error if Authorization header is missing', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');

            const request = new Request('http://localhost/api/test');
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Missing or invalid Authorization header');
        });

        it('should return error if Authorization header does not start with Bearer', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Basic abc123' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Missing or invalid Authorization header');
        });

        it('should return error for invalid API key format', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { isValidApiKeyFormat } = await import('@/lib/api-key-utils');

            vi.mocked(isValidApiKeyFormat).mockReturnValue(false);

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Bearer invalid-key' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Invalid API key format');
        });

        it('should return error if key prefix extraction fails', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { isValidApiKeyFormat, extractKeyPrefix } = await import('@/lib/api-key-utils');

            vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
            vi.mocked(extractKeyPrefix).mockReturnValue(undefined as any);

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Bearer sk_live_test' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Invalid API key');
        });

        it('should return error if no matching keys found', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { isValidApiKeyFormat, extractKeyPrefix } = await import('@/lib/api-key-utils');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
            vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');
            vi.mocked(prisma.apiKey.findMany).mockResolvedValue([]);

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Invalid API key');
        });

        it('should skip expired keys', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
            vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');
            vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
                {
                    id: 'key-1',
                    keyHash: 'hash123',
                    userId: 'user-1',
                    permissions: ['read'],
                    expiresAt: new Date('2020-01-01'), // Expired
                },
            ] as any);

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            // Must verify ALL keys to prevent timing attacks, even if expired
            expect(verifyApiKey).toHaveBeenCalled();
        });

        it('should authenticate successfully with valid key', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { isValidApiKeyFormat, extractKeyPrefix, verifyApiKey } = await import('@/lib/api-key-utils');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
            vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');
            vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
                {
                    id: 'key-1',
                    keyHash: 'hash123',
                    userId: 'user-1',
                    permissions: ['read', 'write'],
                    expiresAt: null, // No expiration
                },
            ] as any);
            vi.mocked(verifyApiKey).mockResolvedValue(true);
            vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(true);
            expect(result.userId).toBe('user-1');
            expect(result.permissions).toEqual(['read', 'write']);
        });

        it('should handle database errors gracefully', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { isValidApiKeyFormat, extractKeyPrefix } = await import('@/lib/api-key-utils');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(isValidApiKeyFormat).mockReturnValue(true);
            vi.mocked(extractKeyPrefix).mockReturnValue('sk_live_12345678');
            vi.mocked(prisma.apiKey.findMany).mockRejectedValue(new Error('DB error'));

            const request = new Request('http://localhost/api/test', {
                headers: { Authorization: 'Bearer sk_live_1234567890abcdef' },
            });
            const result = await authenticateApiKey(request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Authentication failed');
        });
    });

    describe('authenticateRequest', () => {
        it('should return session auth if session exists', async () => {
            const { authenticateRequest } = await import('@/lib/api-key-auth');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: 'session-user-1', email: 'test@example.com' },
            } as any);

            const request = new Request('http://localhost/api/test');
            const result = await authenticateRequest(request);

            expect(result.authenticated).toBe(true);
            expect(result.userId).toBe('session-user-1');
            expect(result.permissions).toEqual(['read', 'write']);
        });

        it('should fall back to API key auth if no session', async () => {
            const { authenticateRequest } = await import('@/lib/api-key-auth');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = new Request('http://localhost/api/test');
            const result = await authenticateRequest(request);

            // No session and no API key header
            expect(result.authenticated).toBe(false);
        });
    });

    describe('hasPermission', () => {
        it('should return true if user has admin permission', async () => {
            const { hasPermission } = await import('@/lib/api-key-auth');

            expect(hasPermission(['admin'], 'read')).toBe(true);
            expect(hasPermission(['admin'], 'write')).toBe(true);
            expect(hasPermission(['admin'], 'admin')).toBe(true);
        });

        it('should return true for write when user has write permission', async () => {
            const { hasPermission } = await import('@/lib/api-key-auth');

            expect(hasPermission(['write'], 'write')).toBe(true);
            expect(hasPermission(['write'], 'read')).toBe(true);
        });

        it('should return true for read when user has read permission', async () => {
            const { hasPermission } = await import('@/lib/api-key-auth');

            expect(hasPermission(['read'], 'read')).toBe(true);
        });

        it('should return false for write when user only has read permission', async () => {
            const { hasPermission } = await import('@/lib/api-key-auth');

            expect(hasPermission(['read'], 'write')).toBe(false);
        });

        it('should return false when user has no matching permissions', async () => {
            const { hasPermission } = await import('@/lib/api-key-auth');

            expect(hasPermission([], 'read')).toBe(false);
            expect(hasPermission([], 'write')).toBe(false);
            expect(hasPermission([], 'admin')).toBe(false);
        });
    });

    describe('withApiKeyAuth', () => {
        it('should return 401 if not authenticated', async () => {
            const { withApiKeyAuth } = await import('@/lib/api-key-auth');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue(null);

            const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
            const wrappedHandler = withApiKeyAuth(handler);

            const request = new Request('http://localhost/api/test');
            const response = await wrappedHandler(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
            expect(handler).not.toHaveBeenCalled();
        });

        it('should call handler with context if authenticated', async () => {
            const { withApiKeyAuth } = await import('@/lib/api-key-auth');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: 'user-123', email: 'test@example.com' },
            } as any);

            const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
            const wrappedHandler = withApiKeyAuth(handler);

            const request = new Request('http://localhost/api/test');
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalledWith(request, {
                userId: 'user-123',
                permissions: ['read', 'write'],
            });
        });
    });
});
