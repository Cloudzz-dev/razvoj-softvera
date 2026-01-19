import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";
import { env } from "./env";

/**
 * Standard API error response format
 */
interface ApiError {
    error: string;
    details?: unknown;
}

/**
 * Custom error class for API errors with status codes
 */
export class ApiException extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public details?: unknown
    ) {
        super(message);
        this.name = "ApiException";
    }
}

/**
 * Common HTTP error factories
 */
export const HttpError = {
    badRequest: (message = "Bad request", details?: unknown) =>
        new ApiException(message, 400, details),
    unauthorized: (message = "Unauthorized") =>
        new ApiException(message, 401),
    forbidden: (message = "Forbidden") =>
        new ApiException(message, 403),
    notFound: (message = "Not found") =>
        new ApiException(message, 404),
    conflict: (message = "Conflict") =>
        new ApiException(message, 409),
    tooManyRequests: (message = "Too many requests", retryAfter?: number) =>
        new ApiException(message, 429, { retryAfter }),
    internal: (message = "Internal server error") =>
        new ApiException(message, 500),
};

/**
 * Global error handler for API routes
 * Catches errors and returns consistent JSON responses
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                error: "Validation failed",
                details: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
            { status: 400 }
        );
    }

    // Handle custom API exceptions
    if (error instanceof ApiException) {
        const response: ApiError = { error: error.message };
        if (error.details) {
            response.details = error.details;
        }

        if (error.statusCode >= 500) {
            logger.error(`API Exception: ${error.message}`, error, { statusCode: error.statusCode });
        } else {
            logger.warn(`API Warning: ${error.message}`, { statusCode: error.statusCode });
        }

        return NextResponse.json(response, { status: error.statusCode });
    }

    // Handle known Prisma errors (avoid exposing internal details)
    if (error instanceof Error && error.name?.includes("Prisma")) {
        logger.error("Database error", error);
        return NextResponse.json(
            { error: "Database operation failed" },
            { status: 500 }
        );
    }

    // Handle generic errors - log but don't expose details
    if (error instanceof Error) {
        logger.error(`Unhandled error: ${error.message}`, error);

        if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
            return NextResponse.json(
                { error: "Internal server error", details: error.message },
                { status: 500 }
            );
        }
    } else {
        logger.error("Unknown error type", error);
    }

    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
}

/**
 * Wrapper for API route handlers with automatic error handling
 * Usage: export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler(
    handler: (request: Request) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse<unknown | ApiError>> {
    return async (request: Request) => {
        try {
            return await handler(request);
        } catch (error) {
            return handleApiError(error);
        }
    };
}
