import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                followers: true,
                following: true,
                startups: true,
                profile: true,
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Calculate stats
        const connections = user.followers.length + user.following.length;
        const startupsCount = user.startups.length;

        // Count investors (users with INVESTOR role that this user follows)
        const investors = await prisma.user.count({
            where: {
                role: "INVESTOR",
                followers: {
                    some: {
                        followerId: user.id,
                    },
                },
            },
        });

        // Calculate growth (connections made in last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const recentConnections = await prisma.connection.count({
            where: {
                OR: [
                    { followerId: user.id },
                    { followingId: user.id },
                ],
                createdAt: { gte: thirtyDaysAgo },
            },
        });

        const previousConnections = await prisma.connection.count({
            where: {
                OR: [
                    { followerId: user.id },
                    { followingId: user.id },
                ],
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo,
                },
            },
        });

        const growth = previousConnections > 0
            ? Math.round(((recentConnections - previousConnections) / previousConnections) * 100)
            : recentConnections > 0 ? 100 : 0;

        return NextResponse.json({
            connections,
            startups: startupsCount,
            investors,
            growth: growth > 0 ? `+${growth}%` : `${growth}%`,
            profile: user.profile,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        logger.error("STATS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
