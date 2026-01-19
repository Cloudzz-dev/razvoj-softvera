import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';


vi.mock('@/lib/api-security', () => ({
    ensureRateLimit: vi.fn().mockResolvedValue(null),
}));

describe('api/health', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return healthy status', async () => {
        const req = new Request('http://localhost/api/health');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data.uptime).toBeDefined();
        expect(data.timestamp).toBeDefined();
        expect(data.system).toBeUndefined();
    });
});
