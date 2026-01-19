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
            update: vi.fn(),
        },
        connection: {
            count: vi.fn(),
        },
        activity: {
            findMany: vi.fn(),
        },
        profile: {
            upsert: vi.fn(),
        },
        notification: {
            findMany: vi.fn(),
            count: vi.fn(),
            updateMany: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

describe('Phase 2 API Tests (User & Dashboard)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/dashboard/stats', () => {
        it('should return 401 if unauthorized', async () => {
            const { GET: statsGet } = await import('@/app/api/dashboard/stats/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { NextResponse } = await import('next/server');

            vi.mocked(ensureAuthResponse).mockResolvedValue(new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as any);

            const req = new Request('http://localhost/api/dashboard/stats');
            const response = await statsGet(req);
            expect(response.status).toBe(401);
        });

        it('should return stats', async () => {
            const { GET: statsGet } = await import('@/app/api/dashboard/stats/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                followers: [],
                following: [],
                startups: [],
                profile: {},
            } as any);
            vi.mocked(prisma.user.count).mockResolvedValue(5);
            vi.mocked(prisma.connection.count).mockResolvedValue(10);

            const req = new Request('http://localhost/api/dashboard/stats');
            const response = await statsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.investors).toBe(5);
            expect(data.connections).toBe(0);
        });
    });

    describe('GET /api/dashboard/activity', () => {
        it('should return 401 if unauthorized', async () => {
            const { GET: activityGet } = await import('@/app/api/dashboard/activity/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { NextResponse } = await import('next/server');
            vi.mocked(ensureAuthResponse).mockResolvedValue(new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as any);

            const req = new Request('http://localhost/api/dashboard/activity');
            const response = await activityGet(req);
            expect(response.status).toBe(401);
        });

        it('should return activities', async () => {
            const { GET: activityGet } = await import('@/app/api/dashboard/activity/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.activity.findMany).mockResolvedValue([{ id: 'act-1', type: 'login' }] as any);

            const req = new Request('http://localhost/api/dashboard/activity');
            const response = await activityGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
        });
    });

    describe('GET /api/settings', () => {
        it('should return 401 if unauthorized', async () => {
            const { GET: settingsGet } = await import('@/app/api/settings/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { NextResponse } = await import('next/server');
            vi.mocked(ensureAuthResponse).mockResolvedValue(new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as any);

            const req = new Request('http://localhost/api/settings');
            const response = await settingsGet(req);
            expect(response.status).toBe(401);
        });

        it('should return user settings', async () => {
            const { GET: settingsGet } = await import('@/app/api/settings/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                profile: { bio: 'Hello' },
            } as any);

            const req = new Request('http://localhost/api/settings');
            const response = await settingsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.user.email).toBe('test@example.com');
            expect(data.profile.bio).toBe('Hello');
        });
    });

    describe('PATCH /api/settings', () => {
        it('should update settings', async () => {
            const { PATCH: settingsPatch } = await import('@/app/api/settings/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);

            const req = new Request('http://localhost/api/settings', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name', bio: 'New Bio' }),
            });
            const response = await settingsPatch(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.user.update).toHaveBeenCalled();
            expect(prisma.profile.upsert).toHaveBeenCalled();
        });
    });

    describe('GET /api/notifications', () => {
        it('should return notifications', async () => {
            const { GET: notificationsGet } = await import('@/app/api/notifications/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.notification.findMany).mockResolvedValue([{ id: 'notif-1' }] as any);
            vi.mocked(prisma.notification.count).mockResolvedValue(1);

            const req = new Request('http://localhost/api/notifications');
            const response = await notificationsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.notifications).toHaveLength(1);
            expect(data.unreadCount).toBe(1);
        });
    });

    describe('PATCH /api/notifications', () => {
        it('should mark as read', async () => {
            const { PATCH: notificationsPatch } = await import('@/app/api/notifications/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);

            const req = new Request('http://localhost/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ markAllRead: true }),
            });
            const response = await notificationsPatch(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.notification.updateMany).toHaveBeenCalled();
        });
    });

    describe('GET /api/network', () => {
        it('should return network users', async () => {
            const { GET: networkGet } = await import('@/app/api/network/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-2', name: 'Other User' }] as any);

            const req = new Request('http://localhost/api/network');
            const response = await networkGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
            expect(data[0].name).toBe('Other User');
        });
    });
});
