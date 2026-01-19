import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
    ensureAuthResponse: vi.fn(),
}));

// Mock global.fetch
global.fetch = vi.fn();

describe('api/chat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    });

    it('should return 400 for invalid message format', async () => {
        const { ensureAuthResponse } = await import('@/lib/api-security');
        vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);

        const req = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [] }), // Min 1 message required
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
    });

    it('should return AI reply successfully', async () => {
        const { ensureAuthResponse } = await import('@/lib/api-security');
        const { prisma } = await import('@/lib/prisma');

        vi.mocked(ensureAuthResponse).mockResolvedValue({ session: { user: { email: 'test@example.com' } } } as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: '1',
            name: 'Test',
            role: 'DEVELOPER',
            followers: [],
            following: [],
            profile: { skills: ['TS'] }
        } as any);

        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'Hello!' } }]
            }),
        } as any);

        const req = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
        });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.reply).toBe('Hello!');
    });
});
