import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env var
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        blogPost: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
        },
        transaction: {
            findMany: vi.fn(),
        },
        activity: {
            groupBy: vi.fn(),
        },
        thread: {
            count: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

vi.mock('@/lib/sanitize', () => ({
    sanitizeText: vi.fn((text) => text),
}));

describe('Phase 5 API Tests (Content & Payments)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/blog/posts', () => {
        it('should return 401 if unauthorized', async () => {
            const { GET: postsGet } = await import('@/app/api/blog/posts/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { NextResponse } = await import('next/server');

            // Mock ensureAuthResponse to return a NextResponse (which handles inheritance checks correctly in some envs)
            // or just an object that mimics it if not checking instanceof strictly.
            // But best to use real NextResponse or a class passing instanceof.
            // Simplified: Just make it return a response-like object that the controller returns directly.

            const errorResponse = new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
            vi.mocked(ensureAuthResponse).mockResolvedValue(errorResponse as any);

            const req = new Request('http://localhost/api/blog/posts');
            const response = await postsGet(req);
            expect(response.status).toBe(401);
        });

        it('should return 403 if not admin', async () => {
            const { GET: postsGet } = await import('@/app/api/blog/posts/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'user@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'USER' } as any);

            const req = new Request('http://localhost/api/blog/posts');
            const response = await postsGet(req);
            expect(response.status).toBe(403);
        });

        it('should return posts for admin', async () => {
            const { GET: postsGet } = await import('@/app/api/blog/posts/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'admin@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
            vi.mocked(prisma.blogPost.findMany).mockResolvedValue([{ id: 'post-1' }] as any);

            const req = new Request('http://localhost/api/blog/posts');
            const response = await postsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
        });
    });

    describe('POST /api/blog/posts', () => {
        it('should create post', async () => {
            const { POST: postsPost } = await import('@/app/api/blog/posts/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'admin@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);
            vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null); // No duplicate slug
            vi.mocked(prisma.blogPost.create).mockResolvedValue({ id: 'post-1', title: 'New Post' } as any);

            const req = new Request('http://localhost/api/blog/posts', {
                method: 'POST',
                body: JSON.stringify({ title: 'New Post', slug: 'new-post' }),
            });
            const response = await postsPost(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.title).toBe('New Post');
        });
    });

    describe('POST /api/payments/calculate', () => {
        it('should calculate fees', async () => {
            const { POST: calculatePost } = await import('@/app/api/payments/calculate/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);

            const req = new Request('http://localhost/api/payments/calculate', {
                method: 'POST',
                body: JSON.stringify({ amount: 100 }),
            });
            const response = await calculatePost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.amount).toBe(100);
            expect(data.serviceFee).toBe(2.5);
            expect(data.netAmount).toBe(97.5);
        });
    });

    describe('GET /api/transactions', () => {
        it('should return transactions', async () => {
            const { GET: transactionsGet } = await import('@/app/api/transactions/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { id: 'user-1', email: 'test@example.com' } } } as any);
            vi.mocked(prisma.transaction.findMany).mockResolvedValue([{ id: 'tx-1' }] as any);

            const req = new Request('http://localhost/api/transactions');
            const response = await transactionsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
        });
    });

    describe('GET /api/creator/analytics/summary', () => {
        it('should return analytics for admin', async () => {
            const { GET: analyticsGet } = await import('@/app/api/creator/analytics/summary/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'admin@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
            vi.mocked(prisma.user.count).mockResolvedValue(100);
            vi.mocked(prisma.thread.count).mockResolvedValue(50);
            vi.mocked(prisma.blogPost.count).mockResolvedValue(10);
            vi.mocked(prisma.activity.groupBy).mockResolvedValue([{ userId: 'user-1' }] as any);

            const req = new Request('http://localhost/api/creator/analytics/summary');
            const response = await analyticsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.totalUsers).toBe(100);
            expect(data.totalContentViews).toBe(60);
            expect(data.activeUsersToday).toBe(1);
        });
    });
});
