import { describe, it, expect, beforeEach } from 'vitest';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';

describe('lib/rate-limit', () => {
    describe('getClientIp', () => {
        /**
         * WHY: Tests IP extraction from x-forwarded-for header (primary source for proxied requests).
         * This covers the most common production scenario behind load balancers.
         */
        it('should extract IP from x-forwarded-for header (single IP)', () => {
            const request = new Request('http://localhost/api/test', {
                headers: { 'x-forwarded-for': '192.168.1.100' },
            });
            expect(getClientIp(request)).toBe('192.168.1.100');
        });

        /**
         * WHY: x-forwarded-for can contain comma-separated IPs from multiple proxies.
         * The first IP is the original client; we must extract it correctly.
         */
        it('should extract first IP from comma-separated x-forwarded-for', () => {
            const request = new Request('http://localhost/api/test', {
                headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' },
            });
            expect(getClientIp(request)).toBe('203.0.113.50');
        });

        /**
         * WHY: Tests fallback to x-real-ip when x-forwarded-for is absent.
         * Some proxies only set x-real-ip.
         */
        it('should fall back to x-real-ip when x-forwarded-for is not present', () => {
            const request = new Request('http://localhost/api/test', {
                headers: { 'x-real-ip': '10.0.0.1' },
            });
            expect(getClientIp(request)).toBe('10.0.0.1');
        });

        /**
         * WHY: Tests the "unknown" fallback when no IP headers are present.
         * This covers direct connections or misconfigured proxies.
         */
        it('should return "unknown" when no IP headers are present', () => {
            const request = new Request('http://localhost/api/test');
            expect(getClientIp(request)).toBe('unknown');
        });

        /**
         * WHY: Ensures x-forwarded-for takes precedence over x-real-ip.
         * This matches the expected header priority in production.
         */
        it('should prioritize x-forwarded-for over x-real-ip', () => {
            const request = new Request('http://localhost/api/test', {
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'x-real-ip': '5.6.7.8',
                },
            });
            expect(getClientIp(request)).toBe('1.2.3.4');
        });
    });

    describe('checkRateLimit', () => {
        let rateLimiter: RateLimiterMemory;

        beforeEach(() => {
            // Create a fresh rate limiter for each test with low limits for fast testing
            rateLimiter = new RateLimiterMemory({
                points: 2,      // Allow 2 requests
                duration: 60,   // Per 60 seconds
            });
        });

        /**
         * WHY: Tests the happy path - requests under the limit should succeed.
         */
        it('should return success when under rate limit', async () => {
            const result = await checkRateLimit(rateLimiter, 'test-key-1');
            expect(result.success).toBe(true);
            expect(result.retryAfter).toBeUndefined();
        });

        /**
         * WHY: Tests the rate limit enforcement - requests over limit should fail.
         * The retryAfter value tells clients when they can retry.
         */
        it('should return failure with retryAfter when rate limit exceeded', async () => {
            // Consume all available points
            await rateLimiter.consume('test-key-2');
            await rateLimiter.consume('test-key-2');

            // This should exceed the limit
            const result = await checkRateLimit(rateLimiter, 'test-key-2');
            expect(result.success).toBe(false);
            expect(result.retryAfter).toBeDefined();
            expect(result.retryAfter).toBeGreaterThan(0);
        });

        /**
         * WHY: Ensures different keys are tracked independently.
         * User A's rate limit shouldn't affect User B.
         */
        it('should track rate limits independently per key', async () => {
            // Exhaust limit for key-a
            await rateLimiter.consume('key-a');
            await rateLimiter.consume('key-a');

            // key-a should be limited
            const resultA = await checkRateLimit(rateLimiter, 'key-a');
            expect(resultA.success).toBe(false);

            // key-b should still have quota
            const resultB = await checkRateLimit(rateLimiter, 'key-b');
            expect(resultB.success).toBe(true);
        });
    });
});
