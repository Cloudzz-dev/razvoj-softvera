import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getAnalytics } from '@/app/api/creator/analytics/summary/route';
import { GET as getInvites } from '@/app/api/startups/[id]/invites/route';
import { prisma } from '@/lib/prisma';

import { ensureAuthResponse } from '@/lib/api-security';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        thread: {
            count: vi.fn(),
        },
        blogPost: {
            count: vi.fn(),
        },
        activity: {
            groupBy: vi.fn(),
        },
        startupMembership: {
            findUnique: vi.fn(),
        },
        startup: {
            findUnique: vi.fn(),
        },
        teamInvite: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

// Mock API route dependency on app/api/auth/[...nextauth]/route
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

describe('API Gap Fill Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/creator/analytics/summary', () => {
        it('returns 403 if user is not ADMIN', async () => {
            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'user@example.com' } }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'USER' } as any);

            const req = new Request('http://localhost/api/creator/analytics/summary');
            const res = await getAnalytics(req);

            expect(res.status).toBe(403);
            expect(await res.json()).toEqual({ error: 'Access denied. Creator/Admin role required.' });
        });

        it('returns stats for ADMIN', async () => {
            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
            vi.mocked(prisma.user.count).mockResolvedValue(100); // Total users
            vi.mocked(prisma.thread.count).mockResolvedValue(50);
            vi.mocked(prisma.blogPost.count).mockResolvedValue(20);
            vi.mocked(prisma.activity.groupBy).mockResolvedValue([{}, {}, {}] as any); // 3 active users

            const req = new Request('http://localhost/api/creator/analytics/summary');
            const res = await getAnalytics(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.totalUsers).toBe(100);
            expect(data.totalContentViews).toBe(70); // 50 + 20
            expect(data.activeUsersToday).toBe(3);
        });
    });

    describe('GET /api/startups/[id]/invites', () => {
        it('returns 403 if user is not a member', async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'outsider@example.com' }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', email: 'outsider@example.com' } as any);
            vi.mocked(prisma.startupMembership.findUnique).mockResolvedValue(null); // Not a member

            const req = new Request('http://localhost/api/startups/startup1/invites');
            const params = Promise.resolve({ id: 'startup1' });

            // Fix: route handler expects params as second arg
            const res = await getInvites(req, { params });

            expect(res.status).toBe(403);
        });

        it('returns invites for member', async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'member@example.com' }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user2', email: 'member@example.com' } as any);
            vi.mocked(prisma.startupMembership.findUnique).mockResolvedValue({ role: 'MEMBER' } as any);

            vi.mocked(prisma.startup.findUnique).mockResolvedValue({
                id: 'startup1',
                team: { id: 'team1' }
            } as any);

            const mockInvites = [{ id: 'inv1', email: 'invitee@example.com', status: 'PENDING' }];
            vi.mocked(prisma.teamInvite.findMany).mockResolvedValue(mockInvites as any);

            const req = new Request('http://localhost/api/startups/startup1/invites');
            const params = Promise.resolve({ id: 'startup1' });

            const res = await getInvites(req, { params });

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual(mockInvites);
        });
    });
});
