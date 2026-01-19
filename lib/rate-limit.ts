import { RateLimiterMemory, RateLimiterRedis, RateLimiterAbstract } from "rate-limiter-flexible";
import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Rate limiter for Next.js API routes
 * Uses Redis in production for distributed rate limiting across multiple instances.
 * Falls back to in-memory storage if Redis is not configured or unavailable.
 */

// Redis client setup - only connect if REDIS_URL is configured
let redisClient: Redis | null = null;
let useRedis = false;

if (env.REDIS_URL) {
    try {
        redisClient = new Redis(env.REDIS_URL, {
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn("[Rate Limit] Redis connection failed, falling back to memory");
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 1000);
            },
        });

        redisClient.on("error", (err) => {
            console.warn("[Rate Limit] Redis error:", err.message);
            useRedis = false;
        });

        redisClient.on("connect", () => {
            console.log("[Rate Limit] Connected to Redis");
            useRedis = true;
        });

        // Test connection
        redisClient.ping().then(() => {
            useRedis = true;
        }).catch(() => {
            useRedis = false;
        });
    } catch {
        console.warn("[Rate Limit] Failed to initialize Redis, using memory");
        redisClient = null;
    }
}

/**
 * Create a rate limiter that uses Redis if available, otherwise memory
 */
function createRateLimiter(points: number, duration: number, keyPrefix: string): RateLimiterAbstract {
    // Always create memory limiter as fallback
    const memoryLimiter = new RateLimiterMemory({
        points,
        duration,
        keyPrefix: `mem_${keyPrefix}`,
    });

    // If Redis is configured and connected, create Redis limiter
    if (redisClient && useRedis) {
        try {
            return new RateLimiterRedis({
                storeClient: redisClient,
                points,
                duration,
                keyPrefix: `rl_${keyPrefix}`,
                // Use in-memory limiter if Redis fails
                insuranceLimiter: memoryLimiter,
            });
        } catch {
            return memoryLimiter;
        }
    }

    return memoryLimiter;
}

// General API rate limiter: 60 requests per minute
export const generalRateLimiter = createRateLimiter(60, 60, "general");

// Auth rate limiter: 10 requests per minute (stricter for login)
export const authRateLimiter = createRateLimiter(10, 60, "auth");

// AI Chat rate limiter: 10 requests per minute (expensive API calls)
export const chatRateLimiter = createRateLimiter(10, 60, "chat");

// Registration rate limiter: 5 requests per minute
export const registrationRateLimiter = createRateLimiter(5, 60, "register");

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    if (realIp) {
        return realIp;
    }
    return "unknown";
}

/**
 * Check rate limit and return error response if exceeded
 */
export async function checkRateLimit(
    rateLimiter: RateLimiterAbstract,
    key: string
): Promise<{ success: boolean; retryAfter?: number }> {
    try {
        await rateLimiter.consume(key);
        return { success: true };
    } catch (rejRes: any) {
        return {
            success: false,
            retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
        };
    }
}

/**
 * Check if rate limiting is using Redis (for health checks/debugging)
 */
export function isUsingRedis(): boolean {
    return useRedis && redisClient !== null;
}
