import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/creator/analytics/timeseries
 * Fetch metrics over a time period
 * Query params: start_date, end_date, metric
 * Requires ADMIN role
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check for admin role
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

        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get("start_date");
        const endDateStr = searchParams.get("end_date");
        const metric = searchParams.get("metric") || "newUsersCount";

        // Default to last 30 days if no dates provided
        const endDate = endDateStr ? new Date(endDateStr) : new Date();
        const startDate = startDateStr
            ? new Date(startDateStr)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        // For now, calculate metrics on the fly since we may not have historical data
        const result: Array<{ date: string; value: number }> = [];

        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setDate(dayEnd.getDate() + 1);

            let value = 0;

            if (metric === "newUsersCount" || metric === "new_users_count") {
                value = await prisma.user.count({
                    where: {
                        createdAt: {
                            gte: dayStart,
                            lt: dayEnd,
                        },
                    },
                });
            } else if (metric === "totalUserCount" || metric === "total_user_count") {
                value = await prisma.user.count({
                    where: {
                        createdAt: {
                            lt: dayEnd,
                        },
                    },
                });
            } else if (metric === "activeUsersDaily" || metric === "active_users_daily") {
                const activeUsers = await prisma.activity.groupBy({
                    by: ["userId"],
                    where: {
                        createdAt: {
                            gte: dayStart,
                            lt: dayEnd,
                        },
                    },
                });
                value = activeUsers.length;
            }

            result.push({
                date: dayStart.toISOString().split("T")[0],
                value,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return NextResponse.json({
            metric,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            data: result,
        });
    } catch (error) {
        console.error("CREATOR_ANALYTICS_TIMESERIES_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
