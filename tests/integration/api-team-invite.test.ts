import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set env var before imports
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        teamInvite: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        teamMembership: {
            create: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

describe('Team Invite API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/team/invite/[token]', () => {
        it('should return 404 if invite not found', async () => {
            const { GET } = await import('@/app/api/team/invite/[token]/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.teamInvite.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/team/invite/invalid-token');
            const response = await GET(req, { params: Promise.resolve({ token: 'invalid-token' }) });

            expect(response.status).toBe(404);
        });

        it('should return 400 if invite is not PENDING', async () => {
            const { GET } = await import('@/app/api/team/invite/[token]/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.teamInvite.findUnique).mockResolvedValue({
                id: 'invite-1',
                status: 'ACCEPTED',
                expiresAt: new Date(Date.now() + 10000),
            } as any);

            const req = new Request('http://localhost/api/team/invite/used-token');
            const response = await GET(req, { params: Promise.resolve({ token: 'used-token' }) });

            expect(response.status).toBe(400);
        });

        it('should return 400 if invite is expired', async () => {
            const { GET } = await import('@/app/api/team/invite/[token]/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.teamInvite.findUnique).mockResolvedValue({
                id: 'invite-1',
                status: 'PENDING',
                expiresAt: new Date(Date.now() - 10000),
            } as any);

            const req = new Request('http://localhost/api/team/invite/expired-token');
            const response = await GET(req, { params: Promise.resolve({ token: 'expired-token' }) });

            expect(response.status).toBe(400);
        });

        it('should return invite details if valid', async () => {
            const { GET } = await import('@/app/api/team/invite/[token]/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.teamInvite.findUnique).mockResolvedValue({
                id: 'invite-1',
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 10000),
                email: 'test@example.com',
                role: 'MEMBER',
                team: {
                    startup: { name: 'Acme Inc', pitch: 'Best startup', logo: 'logo.png' }
                }
            } as any);

            const req = new Request('http://localhost/api/team/invite/valid-token');
            const response = await GET(req, { params: Promise.resolve({ token: 'valid-token' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.invite.email).toBe('test@example.com');
            expect(data.invite.startup.name).toBe('Acme Inc');
        });
    });

    describe('POST /api/team/invite/[token]', () => {
        it('should return 401 if unauthorized', async () => {
            const { POST } = await import('@/app/api/team/invite/[token]/route');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/team/invite/token', { method: 'POST' });
            const response = await POST(req, { params: Promise.resolve({ token: 'token' }) });

            expect(response.status).toBe(401);
        });

        it('should return 403 if email mismatch', async () => {
            const { POST } = await import('@/app/api/team/invite/[token]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'wrong@example.com' }
            } as any);

            vi.mocked(prisma.teamInvite.findUnique).mockResolvedValue({
                id: 'invite-1',
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 10000),
                email: 'right@example.com',
                team: { startup: { name: 'Acme' } }
            } as any);

            const req = new Request('http://localhost/api/team/invite/token', { method: 'POST' });
            const response = await POST(req, { params: Promise.resolve({ token: 'token' }) });

            expect(response.status).toBe(403);
        });

        it('should accept invite and add member on success', async () => {
            const { POST } = await import('@/app/api/team/invite/[token]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any);

            vi.mocked(prisma.teamInvite.findUnique).mockResolvedValue({
                id: 'invite-1',
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 10000),
                email: 'test@example.com',
                teamId: 'team-1',
                role: 'MEMBER',
                team: { startup: { name: 'Acme', founderId: 'founder-1' } }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', name: 'Test User' } as any);

            const req = new Request('http://localhost/api/team/invite/token', { method: 'POST' });
            const response = await POST(req, { params: Promise.resolve({ token: 'token' }) });

            expect(response.status).toBe(200);

            // Verify DB updates
            expect(prisma.teamMembership.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    teamId: 'team-1',
                    userId: 'user-1',
                    role: 'MEMBER'
                })
            }));

            expect(prisma.teamInvite.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'invite-1' },
                data: { status: 'ACCEPTED' }
            }));
        });
    });
});
