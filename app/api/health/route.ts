import { NextResponse } from "next/server";
import { ensureRateLimit } from "@/lib/api-security";

/**
 * GET /api/health
 * Health check endpoint with system metrics
 */
export async function GET(req: Request) {
    try {
        const rateLimit = await ensureRateLimit(req);
        if (rateLimit) return rateLimit;

        // Opportunistic cleanup of expired users (1% probability)
        // This runs async, doesn't block the response
        const { shouldRunCleanup, cleanupAllExpiredUsers } = await import("@/lib/user-cleanup");
        if (shouldRunCleanup()) {
            cleanupAllExpiredUsers().catch(err => {
                console.error("[HEALTH] Opportunistic cleanup failed:", err);
            });
        }

        return NextResponse.json({
            status: "healthy",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Health check error:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to collect metrics" },
            { status: 500 }
        );
    }
}
