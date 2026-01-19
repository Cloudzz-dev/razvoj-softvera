import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/blog/posts/[id]/route';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        blogPost: {
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

describe('api/blog/posts/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 404 if post not found', async () => {
        const { prisma } = await import('@/lib/prisma');
        vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

        const req = new Request('http://localhost/api/blog/posts/1');
        const response = await GET(req, { params: Promise.resolve({ id: '1' }) });
        expect(response.status).toBe(404);
    });

    it('should return post if found', async () => {
        const { prisma } = await import('@/lib/prisma');
        vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: '1', title: 'Test' } as any);

        const req = new Request('http://localhost/api/blog/posts/1');
        const response = await GET(req, { params: Promise.resolve({ id: '1' }) });
        expect(response.status).toBe(200);
    });

    it('should allow admin to update post', async () => {
        const { getServerSession } = await import('next-auth');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'admin@example.com' } } as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
        vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: '1', status: 'DRAFT' } as any);
        vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: '1', status: 'PUBLISHED' } as any);

        const req = new Request('http://localhost/api/blog/posts/1', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'PUBLISHED' }),
        });
        const response = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
        expect(response.status).toBe(200);
    });
});
