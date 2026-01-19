import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env var before importing routes
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        conversation: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        message: {
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

describe('Messaging API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/conversations/[conversationId]', () => {
        /**
         * WHY: Tests 401 when no session exists.
         */
        it('should return 401 if unauthorized', async () => {
            const { GET } = await import('@/app/api/conversations/[conversationId]/route');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/conversations/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });

            expect(response.status).toBe(401);
        });

        /**
         * WHY: Tests 404 when conversation doesn't exist.
         */
        it('should return 404 if conversation not found', async () => {
            const { GET } = await import('@/app/api/conversations/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/conversations/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Conversation not found');
        });

        /**
         * WHY: Tests 403 when user is not a participant in the conversation.
         */
        it('should return 403 if user is not a participant', async () => {
            const { GET } = await import('@/app/api/conversations/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
                id: 'conv-1',
                participants: [{ userId: 'user-2', user: { id: 'user-2', name: 'Other', role: 'DEVELOPER', image: null } }],
                messages: [],
            } as any);

            const req = new Request('http://localhost/api/conversations/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Forbidden');
        });

        /**
         * WHY: Tests successful conversation retrieval with messages.
         */
        it('should return conversation with messages for participant', async () => {
            const { GET } = await import('@/app/api/conversations/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
                id: 'conv-1',
                participants: [
                    { userId: 'user-1', user: { id: 'user-1', name: 'Me', role: 'DEVELOPER', image: null } },
                    { userId: 'user-2', user: { id: 'user-2', name: 'Other', role: 'INVESTOR', image: null } },
                ],
                messages: [
                    { id: 'msg-1', senderId: 'user-1', content: 'Hello', createdAt: new Date(), read: true, sender: { id: 'user-1', name: 'Me', image: null } },
                ],
            } as any);

            const req = new Request('http://localhost/api/conversations/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.id).toBe('conv-1');
            expect(data.participants).toHaveLength(2);
            expect(data.messages).toHaveLength(1);
        });

        /**
         * WHY: Tests 500 error handling on database failure.
         */
        it('should return 500 on database error', async () => {
            const { GET } = await import('@/app/api/conversations/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.conversation.findUnique).mockRejectedValue(new Error('DB error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const req = new Request('http://localhost/api/conversations/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });

            expect(response.status).toBe(500);
            consoleSpy.mockRestore();
        });
    });

    describe('GET /api/messages/conversations', () => {
        /**
         * WHY: Tests 401 when no session exists.
         */
        it('should return 401 if unauthorized', async () => {
            const { GET } = await import('@/app/api/messages/conversations/route');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue(null);

            const response = await GET();

            expect(response.status).toBe(401);
        });

        /**
         * WHY: Tests 404 when user doesn't exist in DB.
         */
        it('should return 404 if user not found', async () => {
            const { GET } = await import('@/app/api/messages/conversations/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'ghost@example.com' },
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const response = await GET();

            expect(response.status).toBe(404);
        });

        /**
         * WHY: Tests successful conversation list retrieval.
         */
        it('should return formatted conversations list', async () => {
            const { GET } = await import('@/app/api/messages/conversations/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([
                {
                    id: 'conv-1',
                    updatedAt: new Date(),
                    participants: [
                        { userId: 'user-1', user: { id: 'user-1', name: 'Me', email: 'me@test.com', role: 'DEVELOPER', image: null } },
                        { userId: 'user-2', user: { id: 'user-2', name: 'Other', email: 'other@test.com', role: 'INVESTOR', image: null } },
                    ],
                    messages: [{ id: 'msg-1', content: 'Last message', createdAt: new Date(), read: true, senderId: 'user-2' }],
                },
            ] as any);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
            expect(data[0].id).toBe('conv-1');
            expect(data[0].title).toBe('Other');
        });
    });

    describe('GET /api/messages/[conversationId]', () => {
        /**
         * WHY: Tests 401 when no session exists.
         */
        it('should return 401 if unauthorized', async () => {
            const { GET } = await import('@/app/api/messages/[conversationId]/route');
            const { getServerSession } = await import('next-auth');

            vi.mocked(getServerSession).mockResolvedValue(null);

            const req = new Request('http://localhost/api/messages/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });

            expect(response.status).toBe(401);
        });

        /**
         * WHY: Tests 404 when user doesn't exist in DB.
         */
        it('should return 404 if user not found', async () => {
            const { GET } = await import('@/app/api/messages/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'ghost@example.com' },
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const req = new Request('http://localhost/api/messages/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });

            expect(response.status).toBe(404);
        });

        /**
         * WHY: Tests 404 when conversation doesn't exist or user not participant.
         */
        it('should return 404 if conversation not found', async () => {
            const { GET } = await import('@/app/api/messages/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

            const req = new Request('http://localhost/api/messages/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });

            expect(response.status).toBe(404);
        });

        /**
         * WHY: Tests successful message retrieval and marks as read.
         */
        it('should return messages and mark them as read', async () => {
            const { GET } = await import('@/app/api/messages/[conversationId]/route');
            const { getServerSession } = await import('next-auth');
            const { prisma } = await import('@/lib/prisma');

            vi.mocked(getServerSession).mockResolvedValue({
                user: { email: 'test@example.com' },
            } as any);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
            vi.mocked(prisma.conversation.findFirst).mockResolvedValue({ id: 'conv-1' } as any);
            vi.mocked(prisma.message.findMany).mockResolvedValue([
                { id: 'msg-1', content: 'Hello', sender: { id: 'user-2', name: 'Other', email: 'other@test.com', image: null } },
            ] as any);
            vi.mocked(prisma.message.updateMany).mockResolvedValue({ count: 1 } as any);

            const req = new Request('http://localhost/api/messages/conv-1');
            const response = await GET(req, { params: Promise.resolve({ conversationId: 'conv-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.messages).toHaveLength(1);
            expect(prisma.message.updateMany).toHaveBeenCalledWith({
                where: {
                    conversationId: 'conv-1',
                    senderId: { not: 'user-1' },
                    read: false,
                },
                data: { read: true },
            });
        });
    });
});
