import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/documentation/route';

describe('api/documentation', () => {
    it('should return API documentation object', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.title).toBe('DFDS.io API Documentation');
        expect(data.endpoints).toBeDefined();
        expect(data.endpoints.length).toBeGreaterThan(0);
    });
});
