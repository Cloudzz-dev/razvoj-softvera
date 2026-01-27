import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getDashboardStats = unstable_cache(
    async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        startups: true,
                    }
                }
            },
        });

        if (!user) return null;

        // Calculate stats
        const connections = user._count.followers + user._count.following;
        const startupsCount = user._count.startups;

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

        const growthPercent = previousConnections > 0
            ? Math.round(((recentConnections - previousConnections) / previousConnections) * 100)
            : recentConnections > 0 ? 100 : 0;

        return {
            connections,
            startups: startupsCount,
            investors,
            growth: growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`,
            profile: user.profile,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            }
        };
    },
    ['dashboard-stats'],
    { revalidate: 3600, tags: ['dashboard-stats'] }
);

export const getRecentActivity = unstable_cache(
    async (userId: string) => {
        return prisma.activity.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
    },
    ['recent-activity'],
    { revalidate: 60, tags: ['recent-activity'] }
);

export const getGrowthMetrics = unstable_cache(
    async (timeRange: string = "month", userId: string) => {
        // Determine date range
        const now = new Date();
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (timeRange === "week") startDate.setDate(now.getDate() - 7);
        else if (timeRange === "month") startDate.setMonth(now.getMonth() - 1);
        else if (timeRange === "quarter") startDate.setMonth(now.getMonth() - 3);
        else if (timeRange === "year") startDate.setFullYear(now.getFullYear() - 1);

        // 1. Fetch data efficiently
        const [
            initialUserCount,
            recentUsers,
            initialConnectionCount,
            recentConnections,
            initialRevenueSum,
            recentTransactions,
            activeUsersMetrics
        ] = await Promise.all([
            // Users count before startDate
            prisma.startupMembership.count({
                where: {
                    startup: { founderId: userId },
                    joinedAt: { lt: startDate }
                }
            }),
            // Users within range
            prisma.startupMembership.findMany({
                where: {
                    startup: { founderId: userId },
                    joinedAt: { gte: startDate }
                },
                select: { joinedAt: true },
                orderBy: { joinedAt: "asc" }
            }),
            // Connections count before startDate
            prisma.connection.count({
                where: {
                    OR: [{ followerId: userId }, { followingId: userId }],
                    createdAt: { lt: startDate }
                }
            }),
            // Connections within range
            prisma.connection.findMany({
                where: {
                    OR: [{ followerId: userId }, { followingId: userId }],
                    createdAt: { gte: startDate }
                },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" }
            }),
            // Revenue sum before startDate
            prisma.transaction.aggregate({
                where: {
                    receiverId: userId,
                    status: "COMPLETED",
                    createdAt: { lt: startDate }
                },
                _sum: { amount: true }
            }),
            // Transactions within range
            prisma.transaction.findMany({
                where: {
                    receiverId: userId,
                    status: "COMPLETED",
                    createdAt: { gte: startDate }
                },
                select: { createdAt: true, amount: true },
                orderBy: { createdAt: "asc" }
            }),
            // Active Users metrics within range
            prisma.metric.findMany({
                where: {
                    userId: userId,
                    type: "active_users",
                    createdAt: { gte: startDate }
                },
                select: { createdAt: true, value: true },
                orderBy: { createdAt: "asc" },
                take: 100 // Cap metrics to prevent memory issues
            }),
        ]);

        // Helper to generate daily data points
        const generateTimeSeries = (
            data: any[],
            initialValue: number = 0,
            getValue: (item: any) => number = () => 1,
            isCumulative: boolean = true,
            dateField: string = "createdAt"
        ) => {
            const points: { date: string; value: number }[] = [];
            let currentCumulative = initialValue;

            const dailyMap = new Map<string, number>();
            data.forEach(item => {
                const d = new Date(item[dateField] || item.joinedAt);
                const dateKey = d.toISOString().split('T')[0];
                dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + getValue(item));
            });

            let currentDate = new Date(startDate);
            while (currentDate <= now) {
                const dateKey = currentDate.toISOString().split('T')[0];
                const dayValue = dailyMap.get(dateKey) || 0;

                if (isCumulative) {
                    currentCumulative += dayValue;
                    points.push({
                        date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        value: currentCumulative,
                    });
                } else {
                    points.push({
                        date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        value: dayValue,
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return points;
        };

        return {
            users: generateTimeSeries(recentUsers, initialUserCount),
            connections: generateTimeSeries(recentConnections, initialConnectionCount),
            revenue: generateTimeSeries(recentTransactions, initialRevenueSum._sum.amount || 0, (t) => t.amount),
            active_users: generateTimeSeries(activeUsersMetrics, 0, (m) => m.value, false),
        };
    },
    ['growth-metrics'],
    { revalidate: 30, tags: ['growth-metrics'] }
);

export const getFounderStats = unstable_cache(
    async (userId: string) => {
        const startup = await prisma.startup.findFirst({
            where: { founderId: userId },
            include: {
                team: {
                    include: {
                        members: true
                    }
                }
            }
        });

        if (!startup) return null;

        const latestActiveUsers = await prisma.metric.findFirst({
            where: {
                userId: userId,
                type: "active_users"
            },
            orderBy: { createdAt: "desc" }
        });

        const burnRate = (startup.teamSize || 0) * 5000;

        return {
            companyName: startup.name,
            raised: startup.raised || "$0",
            stage: startup.stage,
            teamSize: startup.teamSize || startup.team?.members.length || 0,
            activeUsers: latestActiveUsers?.value || 0,
            burnRate: burnRate,
            runway: "12 months",
        };
    },
    ['founder-stats'],
    { revalidate: 300, tags: ['founder-stats'] }
);
