import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env var
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        conversation: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        message: {
            create: vi.fn(),
        },
        activity: {
            create: vi.fn(),
        },
        thread: {
            findMany: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    generalRateLimiter: {},
    chatRateLimiter: {},
}));

vi.mock('@/lib/sanitize', () => ({
    sanitizeText: vi.fn((text) => text),
    sanitizeMessage: vi.fn((text) => text),
}));

vi.mock('@/lib/pusher', () => ({
    pusherServer: {
        trigger: vi.fn().mockResolvedValue(true),
    },
}));

vi.mock('@/lib/conversation-utils', () => ({
    getOrCreateConversation: vi.fn().mockResolvedValue({ id: 'conv-1' }),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Phase 4 API Tests (Communication)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/chat', () => {
        it('should return 401 if unauthorized', async () => {
            const { POST: chatPost } = await import('@/app/api/chat/route');
            const { getServerSession } = await import('next-auth');
            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/chat', { method: 'POST' });
            const response = await chatPost(req);
            expect(response.status).toBe(401);
        });

        it('should return chat response', async () => {
            const { POST: chatPost } = await import('@/app/api/chat/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                name: 'User',
                role: 'FOUNDER',
                startups: [],
                followers: [],
                following: [],
            } as any);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Hello!' } }],
                }),
            } as any);

            const req = new Request('http://localhost/api/chat', {
                method: 'POST',
                body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
            });
            const response = await chatPost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.reply).toBe('Hello!');
        });
    });

    describe('GET /api/conversations', () => {
        it('should return conversations', async () => {
            const { GET: conversationsGet } = await import('@/app/api/conversations/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com' } } as any);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([
                {
                    id: 'conv-1',
                    participants: [{ user: { id: 'user-2', name: 'Other' } }],
                    messages: [{ content: 'Hi', createdAt: new Date() }],
                    _count: { messages: 0 },
                },
            ] as any);

            const req = new Request('http://localhost/api/conversations');
            const response = await conversationsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.conversations).toHaveLength(1);
        });
    });

    describe('POST /api/messages/send', () => {
        it('should send message', async () => {
            const { POST: messagePost } = await import('@/app/api/messages/send/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', name: 'User 1' } as any);
            vi.mocked(prisma.conversation.findFirst).mockResolvedValue({ id: 'conv-1' } as any);
            vi.mocked(prisma.message.create).mockResolvedValue({ id: 'msg-1', content: 'Hello', createdAt: new Date() } as any);

            const req = new Request('http://localhost/api/messages/send', {
                method: 'POST',
                body: JSON.stringify({ receiverId: 'user-2', content: 'Hello' }),
            });
            const response = await messagePost(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.content).toBe('Hello');
            expect(prisma.message.create).toHaveBeenCalled();
            expect(prisma.activity.create).toHaveBeenCalled();
        });
    });

    describe('GET /api/threads', () => {
        it('should return threads', async () => {
            const { GET: threadsGet } = await import('@/app/api/threads/route');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(prisma.thread.findMany).mockResolvedValue([
                {
                    id: 'thread-1',
                    title: 'Thread 1',
                    author: { name: 'Author' },
                    replies: [],
                    likes: [],
                    _count: { replies: 0, likes: 0 },
                },
            ] as any);
            vi.mocked(prisma.thread.count).mockResolvedValue(1);

            const req = new Request('http://localhost/api/threads');
            const response = await threadsGet(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.threads).toHaveLength(1);
        });
    });

    describe('POST /api/threads', () => {
        it('should create thread', async () => {
            const { POST: threadsPost } = await import('@/app/api/threads/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.thread.create).mockResolvedValue({ id: 'thread-1' } as any);

            const req = new Request('http://localhost/api/threads', {
                method: 'POST',
                body: JSON.stringify({ title: 'New Thread', content: 'Thread Content' }),
            });
            const response = await threadsPost(req);


            expect(response.status).toBe(201);
            expect(prisma.thread.create).toHaveBeenCalled();
        });
    });
});
