import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as teamSyncPOST } from '@/app/api/v1/team/sync/route';
import { POST as fundingPOST } from '@/app/api/v1/startup/funding/route';
import { POST as portfolioPOST } from '@/app/api/v1/investor/portfolio/route';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        startup: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        team: {
            create: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        teamMembership: {
            upsert: vi.fn(),
        },
        teamInvite: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        profile: {
            upsert: vi.fn(),
        },
        apiKey: {
            findMany: vi.fn(),
            update: vi.fn(),
        }
    },
}));

// Mock auth library
vi.mock('@/lib/api-key-auth', () => ({
    authenticateApiKey: vi.fn(),
}));

describe('Ingestion APIs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/v1/team/sync', () => {
        it('should return 401 if unauthorized', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            vi.mocked(authenticateApiKey).mockResolvedValue({ authenticated: false, error: 'Unauthorized' });

            const req = new Request('http://localhost/api/v1/team/sync', {
                method: 'POST',
                body: JSON.stringify({ members: [] })
            });
            const res = await teamSyncPOST(req);
            expect(res.status).toBe(401);
        });

        it('should return 400 if validation fails', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            vi.mocked(authenticateApiKey).mockResolvedValue({ authenticated: true, userId: 'user-1' });

            const req = new Request('http://localhost/api/v1/team/sync', {
                method: 'POST',
                body: JSON.stringify({ members: [] }) // Empty array fails min(1)
            });
            const res = await teamSyncPOST(req);
            expect(res.status).toBe(400);
        });

        it('should sync team members successfully', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(authenticateApiKey).mockResolvedValue({ authenticated: true, userId: 'founder-1' });

            // Mock startup found
            vi.mocked(prisma.startup.findFirst).mockResolvedValue({
                id: 'startup-1',
                founderId: 'founder-1',
                team: { id: 'team-1' }
            } as any);

            // Mock user lookup (1 exists, 1 new)
            vi.mocked(prisma.user.findUnique)
                .mockResolvedValueOnce({ id: 'user-2' } as any) // existing
                .mockResolvedValueOnce(null); // new

            // Mock membership upsert
            vi.mocked(prisma.teamMembership.upsert).mockResolvedValue({ createdAt: new Date() } as any);

            // Mock invite creation
            vi.mocked(prisma.teamInvite.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.teamInvite.create).mockResolvedValue({} as any);

            const req = new Request('http://localhost/api/v1/team/sync', {
                method: 'POST',
                body: JSON.stringify({
                    members: [
                        { email: 'existing@test.com', role: 'MEMBER' },
                        { email: 'new@test.com', role: 'ADMIN' }
                    ]
                })
            });

            const res = await teamSyncPOST(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.results.added).toBe(1);
            expect(data.results.invited).toBe(1);
        });
    });

    describe('POST /api/v1/startup/funding', () => {
        it('should update funding info', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(authenticateApiKey).mockResolvedValue({ authenticated: true, userId: 'founder-1' });
            vi.mocked(prisma.startup.findFirst).mockResolvedValue({ id: 'startup-1' } as any);
            vi.mocked(prisma.startup.update).mockResolvedValue({
                id: 'startup-1',
                name: 'Test Inc',
                raised: '$5M',
                stage: 'Series A'
            } as any);

            const req = new Request('http://localhost/api/v1/startup/funding', {
                method: 'POST',
                body: JSON.stringify({
                    totalRaised: '$5M',
                    stage: 'Series A',
                    round: 'Series A'
                })
            });

            const res = await fundingPOST(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.startup.update).toHaveBeenCalledWith({
                where: { id: 'startup-1' },
                data: expect.objectContaining({
                    raised: '$5M',
                    stage: 'Series A'
                })
            });
        });
    });

    describe('POST /api/v1/investor/portfolio', () => {
        it('should update portfolio count', async () => {
            const { authenticateApiKey } = await import('@/lib/api-key-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(authenticateApiKey).mockResolvedValue({ authenticated: true, userId: 'investor-1' });
            vi.mocked(prisma.profile.upsert).mockResolvedValue({ portfolio: 2 } as any);

            const req = new Request('http://localhost/api/v1/investor/portfolio', {
                method: 'POST',
                body: JSON.stringify({
                    companies: [
                        { name: 'Comp A' },
                        { name: 'Comp B' }
                    ]
                })
            });

            const res = await portfolioPOST(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.updatedCount).toBe(2);
            expect(prisma.profile.upsert).toHaveBeenCalledWith({
                where: { userId: 'investor-1' },
                update: { portfolio: 2 },
                create: { userId: 'investor-1', portfolio: 2 }
            });
        });
    });
});
