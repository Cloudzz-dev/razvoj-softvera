import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import dynamic from "next/dynamic";
// import { GrowthDashboard } from "@/components/dashboard/GrowthDashboard"; // Replaced with dynamic
const GrowthDashboard = dynamic(
    () => import("@/components/dashboard/GrowthDashboard").then((mod) => mod.GrowthDashboard),
    { loading: () => <div className="h-[500px] w-full bg-white/5 animate-pulse rounded-xl" /> }
);
import { FounderDashboard } from "@/components/dashboard/FounderDashboard"; // NEW
import { Rocket, Users, Briefcase, TrendingUp, ArrowRight, Send, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getDashboardStats, getRecentActivity, getGrowthMetrics, getFounderStats } from "@/lib/dashboard-queries"; // NEW
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Loading skeleton for stats cards
function StatsLoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 md:p-6 rounded-xl border border-white/10 bg-black/40 animate-pulse">
                    <div className="h-12 w-12 rounded-lg bg-white/10 mb-4" />
                    <div className="h-8 w-16 rounded bg-white/10 mb-2" />
                    <div className="h-4 w-24 rounded bg-white/5" />
                </div>
            ))}
        </div>
    );
}

// Loading skeleton for activity section
function ActivityLoadingSkeleton() {
    return (
        <div className="p-6 rounded-xl border border-white/10 bg-black/40 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="flex-1">
                        <div className="h-4 w-3/4 rounded bg-white/10 mb-2" />
                        <div className="h-3 w-1/4 rounded bg-white/5" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const quickActions = [
    { name: "Find Co-founders", href: "/dashboard/network", icon: Users },
    { name: "Browse Startups", href: "/dashboard/startups", icon: Rocket },
    { name: "Connect with Investors", href: "/dashboard/investors", icon: Briefcase },
] as const;

function getRelativeTime(dateString: any) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth/signin");
    }

    const isFounder = session.user.role === "FOUNDER";

    const [stats, activity, growthData, founderStats] = await Promise.all([
        getDashboardStats(session.user.id),
        getRecentActivity(session.user.id),
        getGrowthMetrics("month", session.user.id),
        isFounder ? getFounderStats(session.user.id) : Promise.resolve(null)
    ]);

    const statsCards = stats ? [
        { name: "Connections", value: stats.connections.toString(), icon: Users, color: "indigo" },
        { name: "Startups", value: stats.startups.toString(), icon: Rocket, color: "purple" },
        { name: "Investors", value: stats.investors.toString(), icon: Briefcase, color: "pink" },
        { name: "Growth", value: stats.growth, icon: TrendingUp, color: "green" },
    ] : [];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {session.user.name?.split(" ")[0] || "there"}!
                </h1>
                <p className="text-zinc-400">
                    {isFounder
                        ? "Here is your startup's performance overview."
                        : "Here's what's happening with your network today."}
                </p>
            </div>

            {/* Conditional Dashboard Rendering */}
            {isFounder ? (
                <FounderDashboard stats={founderStats} growthData={growthData} />
            ) : (
                <>
                    {/* Access & Network Stats */}
                    <Suspense fallback={<StatsLoadingSkeleton />}>
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            {statsCards.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <GlassCard key={stat.name} className="p-4 md:p-6 border-white/10 bg-black/40">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                                                <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                                        <p className="text-sm text-zinc-400">{stat.name}</p>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    </Suspense>

                    {/* Growth Analytics (Network) */}
                    <GrowthDashboard initialData={growthData} />
                </>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.name} href={action.href}>
                                <GlassCard className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-medium text-white">{action.name}</span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                </GlassCard>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/messages">
                    <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 hover:from-indigo-600/30 hover:to-purple-600/20 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-white/10">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Messages</h3>
                                    <p className="text-sm text-zinc-300">Connect with your network</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/dashboard/payments">
                    <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-green-600/20 to-emerald-600/10 hover:from-green-600/30 hover:to-emerald-600/20 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-white/10">
                                    <Send className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Payments</h3>
                                    <p className="text-sm text-zinc-300">Send and receive payments</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                    </GlassCard>
                </Link>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                <Suspense fallback={<ActivityLoadingSkeleton />}>
                    <GlassCard className="p-6 border-white/10 bg-black/40">
                        {activity.length > 0 ? (
                            <div className="space-y-4">
                                {activity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="text-2xl">{item.icon || "📌"}</div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.message}</p>
                                            <p className="text-sm text-zinc-500">{getRelativeTime(item.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-zinc-400">
                                <p>No recent activity yet.</p>
                                <p className="text-sm mt-2">Start connecting with people to see your activity here!</p>
                            </div>
                        )}
                    </GlassCard>
                </Suspense>
            </div>
        </div>
    );
}
