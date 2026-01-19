import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/admin/users/route';


vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    },
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

describe('api/admin/users', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        /**
         * WHY: Tests authorization failure when user email is missing from session.
         * This covers the early return guard at line 18.
         */
        it('should return 401 if session user email is missing', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: null } }
            } as any);

            const req = new Request('http://localhost/api/admin/users');
            const response = await GET(req);
            expect(response.status).toBe(401);
        });

        /**
         * WHY: Tests authorization when user has role but is not ADMIN.
         */
        it('should return 403 if not admin', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'user@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'DEVELOPER' } as any);

            const req = new Request('http://localhost/api/admin/users');
            const response = await GET(req);
            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.error).toContain('Admin role required');
        });

        /**
         * WHY: Tests 403 when user doesn't exist in DB (null returned).
         */
        it('should return 403 if current user not found in DB', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'ghost@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/admin/users');
            const response = await GET(req);
            expect(response.status).toBe(403);
        });

        /**
         * WHY: Tests successful admin access and user list retrieval.
         */
        it('should return users if admin', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([
                { id: 'user-1', name: 'Test User', email: 'test@example.com' }
            ] as any);
            vi.mocked(prisma.user.count).mockResolvedValue(1);

            const req = new Request('http://localhost/api/admin/users');
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users).toHaveLength(1);
        });

        /**
         * WHY: Tests 500 error handling when database fails.
         */
        it('should return 500 on database error', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const req = new Request('http://localhost/api/admin/users');
            const response = await GET(req);

            expect(response.status).toBe(500);
            consoleSpy.mockRestore();
        });
    });

    describe('PUT', () => {
        /**
         * WHY: Tests validation error for invalid request body.
         */
        it('should return 400 for invalid request body', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);

            const req = new Request('http://localhost/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify({ userId: '', role: 'INVALID_ROLE' }),
            });
            const response = await PUT(req);
            expect(response.status).toBe(400);
        });

        /**
         * WHY: Tests that admin cannot demote themselves.
         */
        it('should prevent self-demotion', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);

            const req = new Request('http://localhost/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify({ userId: 'admin-1', role: 'DEVELOPER' }),
            });
            const response = await PUT(req);
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('You cannot demote yourself');
        });

        /**
         * WHY: Tests successful role update.
         */
        it('should update user role successfully', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);
            vi.mocked(prisma.user.update).mockResolvedValue({
                id: 'user-2',
                name: 'Jane',
                email: 'jane@example.com',
                role: 'INVESTOR'
            } as any);

            const req = new Request('http://localhost/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify({ userId: 'user-2', role: 'INVESTOR' }),
            });
            const response = await PUT(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.user.role).toBe('INVESTOR');
        });
    });

    describe('DELETE', () => {
        /**
         * WHY: Tests 403 when non-admin attempts delete.
         */
        it('should return 403 if not admin', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'user@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', role: 'DEVELOPER' } as any);

            const req = new Request('http://localhost/api/admin/users?userId=user-2', {
                method: 'DELETE',
            });
            const response = await DELETE(req);
            expect(response.status).toBe(403);
        });

        /**
         * WHY: Tests 400 when userId query param is missing.
         */
        it('should return 400 if userId param is missing', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);

            const req = new Request('http://localhost/api/admin/users', {
                method: 'DELETE',
            });
            const response = await DELETE(req);
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('userId is required');
        });

        /**
         * WHY: Tests that admin cannot delete themselves.
         */
        it('should return 400 if admin tries to delete themselves', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);

            const req = new Request('http://localhost/api/admin/users?userId=admin-1', {
                method: 'DELETE',
            });
            const response = await DELETE(req);
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('You cannot delete yourself');
        });

        /**
         * WHY: Tests successful user deletion.
         */
        it('should delete user successfully', async () => {
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);
            vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

            const req = new Request('http://localhost/api/admin/users?userId=user-2', {
                method: 'DELETE',
            });
            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('User deleted successfully');
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
        });
    });
});

