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

        // Get total users (lifetime)
        const totalUsers = await prisma.user.count();

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get new users today
        const newUsersToday = await prisma.user.count({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        // Get total content views (sum of thread views + blog views)
        const threadCount = await prisma.thread.count();
        const blogPostCount = await prisma.blogPost.count({
            where: { publishedAt: { not: null } },
        });
        const totalContentViews = threadCount + blogPostCount;

        // Get active users today (users with any activity)
        const activeUsersToday = await prisma.activity.groupBy({
            by: ["userId"],
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        // Get telemetry stats (Legacy)
        // Set to 0 since we've migrated to PostHog
        const pageViews = 0;
        const clicks = 0;
        const avgDwellTime = 0;

        return NextResponse.json({
            totalUsers,
            newUsersToday,
            totalContentViews,
            activeUsersToday: activeUsersToday.length,
            telemetry: {
                pageViews,
                clicks,
                avgDwellTime,
            },
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("CREATOR_ANALYTICS_SUMMARY_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
