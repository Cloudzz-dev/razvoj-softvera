import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env var
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        startup: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        startupMembership: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
        },
        teamMembership: {
            findFirst: vi.fn(),
        },
        team: {
            create: vi.fn(),
        },
        teamInvite: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        },
        joinApplication: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            startup: { create: vi.fn().mockResolvedValue({ id: 'startup-1' }) },
            startupMembership: { create: vi.fn() },
            team: { create: vi.fn().mockResolvedValue({ id: 'team-1' }) },
            teamMembership: { create: vi.fn() },
            user: { update: vi.fn() },
        })),
    },
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendTeamInviteEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
}));

describe('Phase 3 API Tests (Startups & Team)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/startups', () => {
        it('should return startups', async () => {
            const { GET: startupsGet } = await import('@/app/api/startups/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.startup.findMany).mockResolvedValue([{ id: 'startup-1', name: 'Startup 1' }] as any);

            const req = new Request('http://localhost/api/startups');
            const response = await startupsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
        });
    });

    describe('POST /api/startups', () => {
        it('should return 401 if unauthorized', async () => {
            const { POST: startupsPost } = await import('@/app/api/startups/route');
            const { getServerSession } = await import('next-auth');
            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/startups', { method: 'POST' });
            const response = await startupsPost(req);
            expect(response.status).toBe(401);
        });

        it('should create startup', async () => {
            const { POST: startupsPost } = await import('@/app/api/startups/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);

            const req = new Request('http://localhost/api/startups', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Startup', pitch: 'Pitch', stage: 'Idea' }),
            });
            const response = await startupsPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.id).toBe('startup-1');
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('GET /api/startups/[id]/members', () => {
        it('should return members', async () => {
            const { GET: membersGet } = await import('@/app/api/startups/[id]/members/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.startupMembership.findUnique).mockResolvedValue({ userId: 'user-1' } as any);
            vi.mocked(prisma.startupMembership.findMany).mockResolvedValue([
                { userId: 'user-1', user: { name: 'User 1' } }
            ] as any);

            const req = new Request('http://localhost/api/startups/startup-1/members');
            const response = await membersGet(req, { params: Promise.resolve({ id: 'startup-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
        });
    });

    describe('GET /api/team', () => {
        it('should return team', async () => {
            const { GET: teamGet } = await import('@/app/api/team/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.startup.findFirst).mockResolvedValue({
                id: 'startup-1',
                name: 'Startup 1',
                team: { id: 'team-1', members: [], invites: [] }
            } as any);

            const response = await teamGet();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.team.id).toBe('team-1');
        });
    });

    describe('POST /api/team/invite', () => {
        it('should send invite', async () => {
            const { POST: invitePost } = await import('@/app/api/team/invite/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', name: 'User 1' } as any);
            vi.mocked(prisma.startup.findFirst).mockResolvedValue({
                team: { id: 'team-1' }
            } as any);
            vi.mocked(prisma.teamMembership.findFirst).mockResolvedValue(null); // Not member
            vi.mocked(prisma.teamInvite.findFirst).mockResolvedValue(null); // No pending invite
            vi.mocked(prisma.teamInvite.create).mockResolvedValue({
                id: 'invite-1',
                email: 'invitee@example.com',
                role: 'MEMBER',
                expiresAt: new Date(),
            } as any);

            const req = new Request('http://localhost/api/team/invite', {
                method: 'POST',
                body: JSON.stringify({ email: 'invitee@example.com' }),
            });
            const response = await invitePost(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(prisma.teamInvite.create).toHaveBeenCalled();
        });
    });

    describe('POST /api/applications/join', () => {
        it('should submit application', async () => {
            const { POST: joinPost } = await import('@/app/api/applications/join/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.joinApplication.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.joinApplication.create).mockResolvedValue({ id: 'app-1' } as any);

            const req = new Request('http://localhost/api/applications/join', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Applicant',
                    email: 'applicant@example.com',
                    role: 'DEVELOPER',
                }),
            });
            const response = await joinPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.joinApplication.create).toHaveBeenCalled();
        });
    });
});
