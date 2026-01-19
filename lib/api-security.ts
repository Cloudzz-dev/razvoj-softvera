import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    generalRateLimiter,
    authRateLimiter,
    chatRateLimiter,
    registrationRateLimiter,
    checkRateLimit,
    getClientIp
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export type RateLimitType = "general" | "auth" | "chat" | "register";

/**
 * Enforces rate limiting on an API route.
 * Returns null if allowed, or a NextResponse (429) if blocked.
 * Usage:
 *   const limit = await ensureRateLimit(req);
 *   if (limit) return limit;
 */
export async function ensureRateLimit(req: Request, type: RateLimitType = "general") {
    const ip = getClientIp(req);
    let limiter;
    let keyPrefix;

    switch (type) {
        case "auth":
            limiter = authRateLimiter;
            keyPrefix = "auth";
            break;
        case "chat":
            limiter = chatRateLimiter;
            keyPrefix = "chat";
            break;
        case "register":
            limiter = registrationRateLimiter;
            keyPrefix = "register";
            break;
        case "general":
        default:
            limiter = generalRateLimiter;
            keyPrefix = "general";
            break;
    }

    const result = await checkRateLimit(limiter, `${keyPrefix}:${ip}`);

    if (!result.success) {
        return NextResponse.json(
            { error: "Too many requests", retryAfter: result.retryAfter },
            { status: 429, headers: { "Retry-After": String(result.retryAfter || 60) } }
        );
    }

    return null;
}

/**
 * Enforces authentication on an API route.
 * Returns the session if authenticated, or throws detailed error if not (or returns null if you want to handle it).
 * BUT to make it easy:
 * Usage:
 *   const session = await ensureAuth();
 *   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function ensureAuth() {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
        return null;
    }
    return session;
}

/**
 * Helper to get authenticated user or return 401 response directly.
 * Usage:
 *   const auth = await ensureAuthOrRedirect();
 *   if (auth instanceof Response) return auth;
 *   const { session, user } = auth;
 */
export async function ensureAuthResponse(): Promise<NextResponse | { session: Session; user: NonNullable<Session["user"]> }> {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return { session, user: session.user };
}
