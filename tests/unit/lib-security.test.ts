import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureRateLimit, ensureAuth } from '@/lib/api-security';
import { NextResponse } from 'next/server';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn(),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
    authRateLimiter: {},
    chatRateLimiter: {},
    registrationRateLimiter: {},
}));

describe('lib/api-security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('ensureRateLimit', () => {
        it('should return null if not limit reached', async () => {
            const { checkRateLimit } = await import('@/lib/rate-limit');
            vi.mocked(checkRateLimit).mockResolvedValue({ success: true });

            const req = new Request('http://localhost');
            const result = await ensureRateLimit(req);
            expect(result).toBeNull();
        });

        it('should return 429 response if limit reached', async () => {
            const { checkRateLimit } = await import('@/lib/rate-limit');
            vi.mocked(checkRateLimit).mockResolvedValue({ success: false, retryAfter: 60 });

            const req = new Request('http://localhost');
            const result = await ensureRateLimit(req);
            expect(result).toBeInstanceOf(NextResponse);
            expect(result?.status).toBe(429);
        });
    });

    describe('ensureAuth', () => {
        it('should return null if no session', async () => {
            const { getServerSession } = await import('next-auth');
            vi.mocked(getServerSession).mockResolvedValue(null);

            const result = await ensureAuth();
            expect(result).toBeNull();
        });

        it('should return session if authenticated', async () => {
            const { getServerSession } = await import('next-auth');
            const session = { user: { name: 'Test' } };
            vi.mocked(getServerSession).mockResolvedValue(session as any);

            const result = await ensureAuth();
            expect(result).toEqual(session);
        });
    });
});
