import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('lib/logger', () => {
    let consoleSpy: {
        log: ReturnType<typeof vi.spyOn>;
        error: ReturnType<typeof vi.spyOn>;
        warn: ReturnType<typeof vi.spyOn>;
    };

    beforeEach(() => {
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => { }),
            error: vi.spyOn(console, 'error').mockImplementation(() => { }),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('info', () => {
        /**
         * WHY: Tests that info() logs structured JSON with correct level and timestamp.
         */
        it('should log JSON with level, message, and timestamp', () => {
            logger.info('Test info message');

            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            const loggedArg = consoleSpy.log.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.level).toBe('info');
            expect(parsed.message).toBe('Test info message');
            expect(parsed.timestamp).toBeDefined();
        });

        /**
         * WHY: Tests that optional meta data is included in the log output.
         */
        it('should include meta when provided', () => {
            logger.info('Message with meta', { userId: '123', action: 'login' });

            const loggedArg = consoleSpy.log.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.meta).toEqual({ userId: '123', action: 'login' });
        });
    });

    describe('error', () => {
        /**
         * WHY: Tests error logging with Error object extracts message and stack.
         */
        it('should log error with message and stack trace', () => {
            const testError = new Error('Test error');
            logger.error('Error occurred', testError);

            expect(consoleSpy.error).toHaveBeenCalledTimes(1);
            const loggedArg = consoleSpy.error.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.level).toBe('error');
            expect(parsed.message).toBe('Error occurred');
            expect(parsed.error).toBe('Test error');
            expect(parsed.stack).toBeDefined();
        });

        /**
         * WHY: Tests error logging with a non-Error value (string or object).
         */
        it('should handle non-Error objects', () => {
            logger.error('String error', 'Just a string');

            const loggedArg = consoleSpy.error.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.error).toBe('Just a string');
            expect(parsed.stack).toBeUndefined();
        });

        /**
         * WHY: Tests that error logging includes optional meta.
         */
        it('should include meta when provided', () => {
            logger.error('Error with context', new Error('Oops'), { requestId: 'abc' });

            const loggedArg = consoleSpy.error.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.meta).toEqual({ requestId: 'abc' });
        });
    });

    describe('warn', () => {
        /**
         * WHY: Tests warn() logs with correct level.
         */
        it('should log JSON with warn level', () => {
            logger.warn('Warning message');

            expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
            const loggedArg = consoleSpy.warn.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.level).toBe('warn');
            expect(parsed.message).toBe('Warning message');
            expect(parsed.timestamp).toBeDefined();
        });

        /**
         * WHY: Tests that warn includes meta data.
         */
        it('should include meta when provided', () => {
            logger.warn('Deprecation warning', { feature: 'oldAPI' });

            const loggedArg = consoleSpy.warn.mock.calls[0][0];
            const parsed = JSON.parse(loggedArg);

            expect(parsed.meta).toEqual({ feature: 'oldAPI' });
        });
    });
});
