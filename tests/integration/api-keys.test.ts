import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env var before importing routes
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        apiKey: {
            findMany: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/api-key-utils', () => ({
    generateApiKey: vi.fn().mockResolvedValue({
        plaintext: 'sk_live_1234567890',
        keyHash: 'hashed_key',
        keyPrefix: 'sk_live_12345678',
    }),
}));

describe('API Keys Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/keys', () => {
        it('should return 401 if unauthorized', async () => {
            const { GET: keysGet } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/keys');
            const response = await keysGet(req);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should return list of keys', async () => {
            const { GET: keysGet } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any);
            vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
                { id: 'key-1', name: 'Test Key', keyPrefix: 'sk_live_123', isActive: true, createdAt: new Date() },
            ] as any);

            const req = new Request('http://localhost/api/keys');
            const response = await keysGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
            expect(data[0].id).toBe('key-1');
        });

        /**
         * WHY: Tests 404 when user exists in session but not in database.
         * This covers the early return guard at line 27-29.
         */
        it('should return 404 if user not found in database', async () => {
            const { GET: keysGet } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'ghost@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/keys');
            const response = await keysGet(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });

        /**
         * WHY: Tests 500 error handling when database fails.
         */
        it('should return 500 on database error', async () => {
            const { GET: keysGet } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB connection failed'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const req = new Request('http://localhost/api/keys');
            const response = await keysGet(req);

            expect(response.status).toBe(500);
            consoleSpy.mockRestore();
        });
    });

    describe('POST /api/keys', () => {
        it('should return 401 if unauthorized', async () => {
            const { POST: keysPost } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/keys', { method: 'POST' });
            const response = await keysPost(req);

            expect(response.status).toBe(401);
        });

        it('should create a new key', async () => {
            const { POST: keysPost } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any);
            vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
            vi.mocked(prisma.apiKey.create).mockResolvedValue({
                id: 'new-key',
                name: 'My Key',
                permissions: ['read'],
                createdAt: new Date(),
            } as any);

            const req = new Request('http://localhost/api/keys', {
                method: 'POST',
                body: JSON.stringify({ name: 'My Key' }),
            });
            const response = await keysPost(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.key).toBe('sk_live_1234567890');
        });

        /**
         * WHY: Tests 404 when user exists in session but not in database.
         */
        it('should return 404 if user not found', async () => {
            const { POST: keysPost } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'ghost@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/keys', {
                method: 'POST',
                body: JSON.stringify({ name: 'My Key' }),
            });
            const response = await keysPost(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });

        /**
         * WHY: Tests 400 when user has reached max API keys (5).
         * This covers the limit check at lines 93-98.
         */
        it('should return 400 when max keys limit reached', async () => {
            const { POST: keysPost } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.apiKey.count).mockResolvedValue(5); // At max

            const req = new Request('http://localhost/api/keys', {
                method: 'POST',
                body: JSON.stringify({ name: 'Another Key' }),
            });
            const response = await keysPost(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Maximum of 5 API keys');
        });

        /**
         * WHY: Tests 400 when request body fails Zod validation.
         */
        it('should return 400 on validation error', async () => {
            const { POST: keysPost } = await import('@/app/api/keys/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.apiKey.count).mockResolvedValue(0);

            const req = new Request('http://localhost/api/keys', {
                method: 'POST',
                body: JSON.stringify({ name: '' }), // Invalid: empty name
            });
            const response = await keysPost(req);

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/keys/[id]', () => {
        it('should revoke key', async () => {
            const { PUT: keyPut } = await import('@/app/api/keys/[id]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any);
            vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({ id: 'key-1', userId: 'user-1' } as any);
            vi.mocked(prisma.apiKey.update).mockResolvedValue({ id: 'key-1', isActive: false } as any);

            const req = new Request('http://localhost/api/keys/key-1', { method: 'PUT' });
            const response = await keyPut(req, { params: Promise.resolve({ id: 'key-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.key.isActive).toBe(false);
        });

        /**
         * WHY: Tests 404 when key doesn't exist.
         */
        it('should return 404 if key not found', async () => {
            const { PUT: keyPut } = await import('@/app/api/keys/[id]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/keys/nonexistent', { method: 'PUT' });
            const response = await keyPut(req, { params: Promise.resolve({ id: 'nonexistent' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('API key not found');
        });

        /**
         * WHY: Tests 404 when key belongs to different user (ownership verification).
         * This covers the guard at line 36-38.
         */
        it('should return 404 if key belongs to different user', async () => {
            const { PUT: keyPut } = await import('@/app/api/keys/[id]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({ id: 'key-1', userId: 'user-2' } as any); // Different user

            const req = new Request('http://localhost/api/keys/key-1', { method: 'PUT' });
            const response = await keyPut(req, { params: Promise.resolve({ id: 'key-1' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('API key not found');
        });
    });

    describe('DELETE /api/keys/[id]', () => {
        it('should delete key', async () => {
            const { DELETE: keyDelete } = await import('@/app/api/keys/[id]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any);
            vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({ id: 'key-1', userId: 'user-1' } as any);

            const req = new Request('http://localhost/api/keys/key-1', { method: 'DELETE' });
            const response = await keyDelete(req, { params: Promise.resolve({ id: 'key-1' }) });

            expect(response.status).toBe(200);
            expect(prisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: 'key-1' } });
        });

        /**
         * WHY: Tests 404 when key belongs to a different user (ownership check).
         */
        it('should return 404 if key belongs to different user', async () => {
            const { DELETE: keyDelete } = await import('@/app/api/keys/[id]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({ id: 'key-1', userId: 'user-2' } as any); // Different user

            const req = new Request('http://localhost/api/keys/key-1', { method: 'DELETE' });
            const response = await keyDelete(req, { params: Promise.resolve({ id: 'key-1' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('API key not found');
        });
    });

    describe('PUT /api/keys/[id]/name', () => {
        it('should rename key', async () => {
            const { PUT: keyNamePut } = await import('@/app/api/keys/[id]/name/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any);
            vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({ id: 'key-1', userId: 'user-1', name: 'My Key' } as any);
            vi.mocked(prisma.apiKey.update).mockResolvedValue({ id: 'key-1', name: 'New Name' } as any);

            const req = new Request('http://localhost/api/keys/key-1/name', {
                method: 'PUT',
                body: JSON.stringify({ name: 'New Name' })
            });
            const response = await keyNamePut(req, { params: Promise.resolve({ id: 'key-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.key.name).toBe('New Name');
            expect(prisma.apiKey.update).toHaveBeenCalled();
        });
    });
});
