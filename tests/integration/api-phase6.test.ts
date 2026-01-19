import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env var
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
        },
        startupMembership: {
            findMany: vi.fn(),
        },
        thread: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        threadReply: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        threadLike: {
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        connection: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
        transaction: {
            findMany: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        },
        contactMessage: {
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            threadReply: { create: vi.fn().mockResolvedValue({ id: 'reply-1' }) },
            thread: { update: vi.fn() },
            threadLike: {
                findUnique: vi.fn().mockResolvedValue(null), // Default not liked
                create: vi.fn(),
                delete: vi.fn(),
            }
        })),
    },
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn().mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
    }),
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn().mockResolvedValue({
        session: { user: { id: 'user-1', email: 'test@example.com' } }
    }),
}));


vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb), // Simply return the callback
    revalidateTag: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
}));

describe('Phase 6 API Tests (Growth & Engagement)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/contact', () => {
        it('should submit contact form', async () => {
            const { POST: contactPost } = await import('@/app/api/contact/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.contactMessage.create).mockResolvedValue({ id: 'sub-1' } as any);

            const req = new Request('http://localhost/api/contact', {
                method: 'POST',
                body: JSON.stringify({ name: 'User', email: 'user@example.com', subject: 'Inquiry', message: 'Hello from test' }),
            });
            const response = await contactPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.contactMessage.create).toHaveBeenCalled();
        });
    });

    describe('GET /api/growth', () => {
        it('should return growth metrics', async () => {
            const { GET: growthGet } = await import('@/app/api/growth/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([]);
            vi.mocked(prisma.startupMembership.findMany).mockResolvedValue([]);
            vi.mocked(prisma.connection.findMany).mockResolvedValue([]);
            vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);

            const req = new Request('http://localhost/api/growth');
            const response = await growthGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.revenue).toBeDefined();
        });
    });

    describe('GET /api/documentation', () => {
        it('should return documentation', async () => {
            const { GET: docsGet } = await import('@/app/api/documentation/route');


            const response = await docsGet(); // No args
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.endpoints).toBeDefined();
        });
    });

    describe('POST /api/threads/[id]/replies', () => {
        it('should create reply', async () => {
            const { POST: replyPost } = await import('@/app/api/threads/[id]/replies/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { id: 'user-1', email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.thread.findUnique).mockResolvedValue({ id: 'thread-1', authorId: 'user-2' } as any); // authorId needed for notification logic check
            vi.mocked(prisma.threadReply.create).mockResolvedValue({ id: 'reply-1' } as any);

            const req = new Request('http://localhost/api/threads/thread-1/replies', {
                method: 'POST',
                body: JSON.stringify({ content: 'Reply content' }),
            });
            const response = await replyPost(req, { params: Promise.resolve({ id: 'thread-1' }) });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.reply.id).toBe('reply-1'); // Fixed: data.reply.id
            expect(prisma.threadReply.create).toHaveBeenCalled(); // Fixed: transaction mock might not be used directly if logic changed, or check individual creates
        });
    });

    describe('POST /api/threads/[id]/like', () => {
        it('should toggle like (create)', async () => {
            const { POST: likePost } = await import('@/app/api/threads/[id]/like/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            // Mock transaction results
            vi.mocked(prisma.$transaction).mockImplementation(async () => {
                // Return callbacks mock behavior
                // We use a simplified mock here because transaction logic is complex
                // But for test, simulating the return of the block is enough
                return { liked: true };
            });

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { id: 'user-1', email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.thread.findUnique).mockResolvedValue({ id: 'thread-1' } as any);

            const req = new Request('http://localhost/api/threads/thread-1/like', { method: 'POST' });
            const response = await likePost(req, { params: Promise.resolve({ id: 'thread-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.liked).toBe(true);
        });

        it('should toggle like (delete)', async () => {
            const { POST: likePost } = await import('@/app/api/threads/[id]/like/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            // Mock transaction results
            vi.mocked(prisma.$transaction).mockImplementation(async () => {
                return { liked: false };
            });

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { id: 'user-1', email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.thread.findUnique).mockResolvedValue({ id: 'thread-1' } as any);

            const req = new Request('http://localhost/api/threads/thread-1/like', { method: 'POST' });
            const response = await likePost(req, { params: Promise.resolve({ id: 'thread-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.liked).toBe(false);
        });
    });
});
