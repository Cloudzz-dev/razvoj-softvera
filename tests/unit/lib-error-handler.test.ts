import { describe, it, expect, vi } from 'vitest';
import { handleApiError, ApiException, HttpError, withErrorHandler } from '@/lib/error-handler';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

describe('lib/error-handler', () => {
    describe('handleApiError', () => {
        it('should handle ZodError with 400 status', async () => {
            const zodError = new ZodError([{ code: 'custom', message: 'Invalid', path: ['test'] }]);
            const response = handleApiError(zodError);
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Validation failed');
            expect(data.details).toHaveLength(1);
            expect(data.details[0].field).toBe('test');
        });

        it('should handle generic Error with 500 status', () => {
            const error = new Error('Generic error');
            const response = handleApiError(error);
            expect(response.status).toBe(500);
        });

        it('should handle ApiException with custom status', async () => {
            const error = new ApiException('Not Found', 404);
            const response = handleApiError(error);
            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Not Found');
        });

        /**
         * WHY: Tests that ApiException details are properly included in the response.
         * This is used for validation errors where we want to return field-level details.
         */
        it('should include details in ApiException response when provided', async () => {
            const error = new ApiException('Validation error', 400, { field: 'email', issue: 'invalid format' });
            const response = handleApiError(error);
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Validation error');
            expect(data.details).toEqual({ field: 'email', issue: 'invalid format' });
        });

        /**
         * WHY: Tests Prisma error handling - we catch these to avoid exposing internal DB details.
         * Coverage gap at lines 74-77.
         */
        it('should handle PrismaClientKnownRequestError with 500 status', async () => {
            const prismaError = new Error('Unique constraint failed');
            prismaError.name = 'PrismaClientKnownRequestError';

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const response = handleApiError(prismaError);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Database operation failed');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        /**
         * WHY: Tests the fallback for completely unknown error types.
         * Coverage gap at lines 96-100.
         */
        it('should handle unknown error types with 500 status', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const response = handleApiError('string error');

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Internal server error');
            consoleSpy.mockRestore();
        });

        /**
         * WHY: In development mode, error details should be exposed for debugging.
         * Coverage gap at line 88.
         */
        it('should include error details in development mode', async () => {
            vi.stubEnv('NODE_ENV', 'development');

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const error = new Error('Dev error message');
            const response = handleApiError(error);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.details).toBe('Dev error message');

            vi.unstubAllEnvs();
            consoleSpy.mockRestore();
        });
    });

    describe('HttpError factories', () => {
        /**
         * WHY: Tests all HttpError factory methods to ensure proper status codes.
         * These are convenience methods used throughout API routes.
         */
        it('should create badRequest with 400 status', () => {
            const error = HttpError.badRequest('Bad input');
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Bad input');
        });

        it('should create unauthorized with 401 status', () => {
            const error = HttpError.unauthorized();
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Unauthorized');
        });

        it('should create forbidden with 403 status', () => {
            const error = HttpError.forbidden('Access denied');
            expect(error.statusCode).toBe(403);
            expect(error.message).toBe('Access denied');
        });

        it('should create notFound with 404 status', () => {
            const error = HttpError.notFound('Resource missing');
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Resource missing');
        });

        it('should create conflict with 409 status', () => {
            const error = HttpError.conflict();
            expect(error.statusCode).toBe(409);
        });

        it('should create tooManyRequests with 429 and retryAfter', () => {
            const error = HttpError.tooManyRequests('Slow down', 60);
            expect(error.statusCode).toBe(429);
            expect(error.details).toEqual({ retryAfter: 60 });
        });

        it('should create internal with 500 status', () => {
            const error = HttpError.internal();
            expect(error.statusCode).toBe(500);
        });
    });

    describe('withErrorHandler', () => {
        /**
         * WHY: Tests that successful handlers pass through correctly.
         * Coverage gap at lines 110-114.
         */
        it('should pass through successful handler response', async () => {
            const handler = vi.fn().mockResolvedValue(
                NextResponse.json({ success: true })
            );
            const wrappedHandler = withErrorHandler(handler);

            const request = new Request('http://localhost/api/test');
            const response = await wrappedHandler(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(handler).toHaveBeenCalledWith(request);
        });

        /**
         * WHY: Tests that thrown errors are caught and converted to proper responses.
         */
        it('should catch errors and convert to error response', async () => {
            const handler = vi.fn().mockRejectedValue(
                new ApiException('Handler failed', 422)
            );
            const wrappedHandler = withErrorHandler(handler);

            const request = new Request('http://localhost/api/test');
            const response = await wrappedHandler(request);
            const data = await response.json();

            expect(response.status).toBe(422);
            expect(data.error).toBe('Handler failed');
        });

        /**
         * WHY: Tests that ZodErrors thrown in handlers are properly handled.
         */
        it('should convert ZodError to 400 validation response', async () => {
            const handler = vi.fn().mockRejectedValue(
                new ZodError([{ code: 'custom', message: 'Invalid email', path: ['email'] }])
            );
            const wrappedHandler = withErrorHandler(handler);

            const request = new Request('http://localhost/api/test');
            const response = await wrappedHandler(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Validation failed');
        });
    });
});

