import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('lib/env', () => {
    // Store original env
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
        vi.stubGlobal('window', undefined);
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    describe('validateEnv', () => {
        it('should return false if DATABASE_URL is missing', async () => {
            vi.stubEnv('DATABASE_URL', '');
            vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
            vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-at-least-32-characters-long');

            const { validateEnv } = await import('@/lib/env');
            expect(validateEnv()).toBe(false);
        });

        it('should return false if NEXTAUTH_SECRET is missing', async () => {
            vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
            vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
            vi.stubEnv('NEXTAUTH_SECRET', '');

            const { validateEnv } = await import('@/lib/env');
            expect(validateEnv()).toBe(false);
        });

        it('should return false if NEXTAUTH_URL is missing', async () => {
            vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
            vi.stubEnv('NEXTAUTH_URL', '');
            vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-at-least-32-characters-long');

            const { validateEnv } = await import('@/lib/env');
            expect(validateEnv()).toBe(false);
        });

        it('should return true when all required vars are present', async () => {
            vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
            vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
            vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-at-least-32-characters-long');

            const { validateEnv } = await import('@/lib/env');
            expect(validateEnv()).toBe(true);
        });

        it('should log error for invalid configuration', async () => {
            vi.stubEnv('DATABASE_URL', '');
            vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
            vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-at-least-32-characters-long');
            vi.stubEnv('NODE_ENV', 'development');

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const { validateEnv } = await import('@/lib/env');
            validateEnv();

            expect(consoleSpy).toHaveBeenCalled();
            const errorMessage = consoleSpy.mock.calls[0][0];
            expect(errorMessage).toContain('Invalid environment configuration');

            consoleSpy.mockRestore();
        });

        it('should throw in production mode with invalid configuration', async () => {
            vi.stubEnv('DATABASE_URL', '');
            vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
            vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-at-least-32-characters-long');
            vi.stubEnv('NODE_ENV', 'production');

            const { validateEnv } = await import('@/lib/env');
            expect(() => validateEnv()).toThrow('Invalid environment configuration');
        });
    });

    describe('env object', () => {
        it('should export env object with expected properties', async () => {
            vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
            vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
            vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-at-least-32-characters-long');
            vi.stubEnv('NODE_ENV', 'test');

            const { env } = await import('@/lib/env');

            expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/test');
            expect(env.NEXTAUTH_URL).toBe('http://localhost:3000');
            expect(env.NEXTAUTH_SECRET).toBe('test-secret-at-least-32-characters-long');
            expect(env.NODE_ENV).toBe('test');
        });
    });
});
