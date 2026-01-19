import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set env var
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        activity: {
            groupBy: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

describe('Analytics Internal API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/creator/analytics/timeseries', () => {
        /**
         * WHY: Tests 403 when user is not ADMIN.
         */
        it('should return 403 if user is not ADMIN', async () => {
            const { GET } = await import('@/app/api/creator/analytics/timeseries/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'user@example.com' }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                role: 'USER' // Not ADMIN
            } as any);

            const req = new Request('http://localhost/api/creator/analytics/timeseries');
            const response = await GET(req);

            expect(response.status).toBe(403);
        });

        /**
         * WHY: Tests successful metrics fetching for ADMIN.
         */
        it('should return metrics for valid ADMIN request', async () => {
            const { GET } = await import('@/app/api/creator/analytics/timeseries/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'admin@example.com' }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                role: 'ADMIN'
            } as any);

            // Mock metric calculation
            vi.mocked(prisma.user.count).mockResolvedValue(5);

            const req = new Request('http://localhost/api/creator/analytics/timeseries?metric=newUsersCount&start_date=2024-01-01&end_date=2024-01-02');
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.metric).toBe('newUsersCount');
            expect(data.data).toBeInstanceOf(Array);
            expect(data.data[0].value).toBe(5);
        });
    });
});
