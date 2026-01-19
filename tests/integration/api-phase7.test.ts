import { describe, it, expect, vi, beforeEach } from 'vitest';


// Set required env var
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        startup: {
            findMany: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
        },
        metricHistory: {
            create: vi.fn(),
        },
        transaction: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
        account: {
            create: vi.fn(),
        },
        profile: {
            create: vi.fn(),
        },
        activity: {
            create: vi.fn(),
        },
        verificationToken: {
            create: vi.fn(),
        },
        apiKey: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            metricHistory: { create: vi.fn() },
            user: { create: vi.fn().mockResolvedValue({ id: 'user-1' }) },
            account: { create: vi.fn() },
            profile: { create: vi.fn() },
            verificationToken: { create: vi.fn() },
            activity: { create: vi.fn() },
        })),
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
        compare: vi.fn().mockResolvedValue(true),
    },
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
    authRateLimiter: {},
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    generateVerificationCode: vi.fn().mockReturnValue('123456'),
}));

vi.mock('@/lib/api-key-auth', () => ({
    authenticateRequest: vi.fn().mockResolvedValue({
        authenticated: true,
        userId: 'user-1',
        permissions: ['read', 'write'],
    }),
    hasPermission: vi.fn().mockReturnValue(true),
    validateApiKey: vi.fn().mockResolvedValue({
        valid: true,
        key: { id: 'key-1' },
    }),
}));

describe('Phase 7 API Tests (Admin & V1 Core)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/admin/users', () => {
        it('should return 403 if not admin', async () => {
            const { GET: usersGet } = await import('@/app/api/admin/users/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            // Mock ensureAuthResponse to return valid session
            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'user@example.com' } }
            } as any);

            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'USER' } as any);

            const req = new Request('http://localhost/api/admin/users');
            const response = await usersGet(req);
            expect(response.status).toBe(403);
        });

        it('should return users for admin', async () => {
            const { GET: usersGet } = await import('@/app/api/admin/users/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({
                session: { user: { email: 'admin@example.com' } }
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-1' }] as any);
            vi.mocked(prisma.user.count).mockResolvedValue(1);

            const req = new Request('http://localhost/api/admin/users');
            const response = await usersGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users).toHaveLength(1);
        });
    });

    describe('GET /api/v1/startups', () => {
        it('should return public startups', async () => {
            const { GET: startupsGet } = await import('@/app/api/v1/startups/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.startup.findMany).mockResolvedValue([{
                id: 'startup-1',
                name: 'Startup 1',
                founder: { name: 'Founder Name', id: 'founder-1' }
            }] as any);
            vi.mocked(prisma.startup.count).mockResolvedValue(1);

            const req = new Request('http://localhost/api/v1/startups');
            const response = await startupsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data).toHaveLength(1);
        });
    });

    describe('POST /api/register', () => {
        it('should register new user', async () => {
            const { POST: registerPost } = await import('@/app/api/register/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.user.count).mockResolvedValue(0); // For rate limit
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Email available
            vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-1', name: 'New User', email: 'new@example.com', role: 'DEVELOPER' } as any);
            vi.mocked(prisma.profile.create).mockResolvedValue({ id: 'prof-1' } as any);
            vi.mocked(prisma.activity.create).mockResolvedValue({ id: 'act-1' } as any);
            vi.mocked(prisma.verificationToken.create).mockResolvedValue({ id: 'tok-1' } as any);

            // Fix transaction mock
            vi.mocked(prisma.verificationToken.create).mockResolvedValue({ id: 'tok-1' } as any);
            vi.mocked(prisma.activity.create).mockResolvedValue({ id: 'act-1' } as any);
            vi.mocked(prisma.profile.create).mockResolvedValue({ id: 'prof-1' } as any);

            const req = new Request('http://localhost/api/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'New User',
                    email: 'new@example.com',
                    password: 'password123',
                    role: 'DEVELOPER',
                }),
            });
            const response = await registerPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.user).toBeDefined();
        });
    });

    describe('POST /api/payments/send', () => {
        it('should send payment', async () => {
            const { POST: paymentPost } = await import('@/app/api/payments/send/route');
            const { ensureAuthResponse } = await import('@/lib/api-security');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { id: 'sender-1', email: 'test@example.com' } } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'sender-1' } as any);
            vi.mocked(prisma.transaction.create).mockResolvedValue({ id: 'pay-1' } as any);

            const req = new Request('http://localhost/api/payments/send', {
                method: 'POST',
                body: JSON.stringify({ amount: 100, currency: 'USD', recipientId: 'recipient-1', recipientName: 'Recipient', provider: 'CARD', idempotencyKey: 'test-idempotency-key' }),
            });
            const response = await paymentPost(req);

            expect(response.status).toBe(200);
            expect(prisma.transaction.create).toHaveBeenCalled();
        });
    });
});
