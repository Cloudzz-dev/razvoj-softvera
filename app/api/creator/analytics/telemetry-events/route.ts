import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

/**
 * GET /api/creator/analytics/summary
 * Fetch current top-level KPIs for creator dashboard
 * Requires ADMIN role
 */
export async function GET(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        // Check for admin role
        if (!session.user.email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Access denied. Creator/Admin role required." },
                { status: 403 }
            );
        }

        // Legacy: Get recent telemetry events
        // Now returns empty array as events are captured by PostHog
        const events: any[] = [];

        return NextResponse.json(events);
    } catch (error) {
        console.error("CREATOR_TELEMETRY_EVENTS_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
