import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/blog/posts/route';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        blogPost: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

vi.mock('@/lib/sanitize', () => ({
    sanitizeText: vi.fn((t) => t),
}));

describe('api/blog/posts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should list posts for admin', async () => {
        const { ensureAuthResponse } = await import('@/lib/api-security');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'admin@example.com' } } } as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
        vi.mocked(prisma.blogPost.findMany).mockResolvedValue([{ id: '1', title: 'Test Post' }] as any);

        const req = new Request('http://localhost/api/blog/posts');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
    });

    it('should create a post for admin', async () => {
        const { ensureAuthResponse } = await import('@/lib/api-security');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'admin@example.com' } } } as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);
        vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.blogPost.create).mockResolvedValue({ id: '1', title: 'New Post' } as any);

        const req = new Request('http://localhost/api/blog/posts', {
            method: 'POST',
            body: JSON.stringify({ title: 'New Post', slug: 'new-post', status: 'PUBLISHED' }),
        });
        const response = await POST(req);
        expect(response.status).toBe(201);
    });
});
