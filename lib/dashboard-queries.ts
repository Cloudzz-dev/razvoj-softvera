import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getDashboardStats = unstable_cache(
    async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                followers: true,
                following: true,
                startups: true,
                profile: true,
            },
        });

        if (!user) return null;

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
        // 1. Fetch User-Scoped Data
        const [users, connections, transactions, activeUsersMetrics] = await Promise.all([
            // "Users" = Members of startups founded by this user
            prisma.startupMembership.findMany({
                where: {
                    startup: {
                        founderId: userId
                    }
                },
                select: { joinedAt: true },
                orderBy: { joinedAt: "asc" }
            }),
            // "Connections" = Followers or Following
            prisma.connection.findMany({
                where: {
                    OR: [
                        { followerId: userId },
                        { followingId: userId }
                    ]
                },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" }
            }),
            // "Revenue" = Transactions received by this user
            prisma.transaction.findMany({
                where: {
                    receiverId: userId,
                    status: "COMPLETED" // Only count completed transactions
                },
                select: { createdAt: true, amount: true },
                orderBy: { createdAt: "asc" }
            }),
            // "Active Users" = Ingested metrics with type 'active_users'
            prisma.metric.findMany({
                where: {
                    userId: userId,
                    type: "active_users"
                },
                select: { createdAt: true, value: true },
                orderBy: { createdAt: "asc" }
            }),
        ]);

        // Determine date range
        const now = new Date();
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // Start of today

        if (timeRange === "week") startDate.setDate(now.getDate() - 7);
        else if (timeRange === "month") startDate.setMonth(now.getMonth() - 1);
        else if (timeRange === "quarter") startDate.setMonth(now.getMonth() - 3);
        else if (timeRange === "year") startDate.setFullYear(now.getFullYear() - 1);

        // Helper to generate daily data points
        const generateTimeSeries = (
            data: any[],
            getValue: (item: any) => number = () => 1,
            isCumulative: boolean = true,
            dateField: string = "createdAt"
        ) => {
            const points: { date: string; value: number }[] = [];
            let currentDate = new Date(startDate);
            let cumulativeValue = 0;

            // Calculate initial value before start date
            if (isCumulative) {
                cumulativeValue = data
                    .filter((item) => {
                        const d = new Date(item[dateField] || item.joinedAt);
                        return d < startDate;
                    })
                    .reduce((sum, item) => sum + getValue(item), 0);
            }

            // Optimization: Filter data once for the range
            const rangeData = data.filter((item) => {
                const d = new Date(item[dateField] || item.joinedAt);
                return d >= startDate && d <= now;
            });

            while (currentDate <= now) {
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);

                const dailyValue = rangeData
                    .filter((item) => {
                        const d = new Date(item[dateField] || item.joinedAt);
                        return d >= currentDate && d < nextDate;
                    })
                    .reduce((sum, item) => sum + getValue(item), 0);

                if (isCumulative) {
                    cumulativeValue += dailyValue;
                    points.push({
                        date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        value: cumulativeValue,
                    });
                } else {
                    points.push({
                        date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        value: dailyValue,
                    });
                }


                currentDate.setDate(currentDate.getDate() + 1);
            }
            return points;
        };

        // For active users (metrics), we likely want non-cumulative (daily max/sum) or cumulative?
        // Usually "Active Users" (DAU) is daily count.
        // If the ingestion sends DAU, we should just show that value for the day.
        // Let's assume non-cumulative for metrics for now, or just sum them up for the day.
        // The implementation below sums them up.

        return {
            users: generateTimeSeries(users),
            connections: generateTimeSeries(connections),
            revenue: generateTimeSeries(transactions, (t) => t.amount),
            active_users: generateTimeSeries(activeUsersMetrics, (m) => m.value, false), // Non-cumulative for DAU
        };
    },
    ['growth-metrics'],
    { revalidate: 30, tags: ['growth-metrics'] } // Lower revalidate for faster testing
);

export const getFounderStats = unstable_cache(
    async (userId: string) => {
        // 1. Get the startup where user is Founder
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

        // 2. Get Real-time User Metrics using Metric model
        const latestActiveUsers = await prisma.metric.findFirst({
            where: {
                userId: userId,
                type: "active_users"
            },
            orderBy: { createdAt: "desc" }
        });

        // 3. Get Revenue/Burn from Transactions (Simulated or Real)
        // For now, we will use the 'raised' string from startup profile as "Funds"
        // and simulate burn based on team size if no transaction data.

        const burnRate = (startup.teamSize || 0) * 5000; // Estimated $5k/employee burn

        return {
            companyName: startup.name,
            raised: startup.raised || "$0",
            stage: startup.stage,
            teamSize: startup.teamSize || startup.team?.members.length || 0,
            activeUsers: latestActiveUsers?.value || 0,
            burnRate: burnRate,
            runway: "12 months", // Mock calculation for now
        };
    },
    ['founder-stats'],
    { revalidate: 300, tags: ['founder-stats'] }
);
