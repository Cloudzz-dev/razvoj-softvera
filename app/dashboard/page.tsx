import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import dynamic from "next/dynamic";
const GrowthDashboard = dynamic(
    () => import("@/components/dashboard/GrowthDashboard").then((mod) => mod.GrowthDashboard),
    { loading: () => <div className="h-[500px] w-full bg-white/5 animate-pulse rounded-xl" /> }
);
import { FounderDashboard } from "@/components/dashboard/FounderDashboard";
import { Rocket, Users, Briefcase, TrendingUp, ArrowRight, Send, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getDashboardStats, getRecentActivity, getGrowthMetrics, getFounderStats } from "@/lib/dashboard-queries";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function StatsLoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-3xl border border-white/10 bg-black/40 animate-pulse" />
            ))}
        </div>
    );
}

function ActivityLoadingSkeleton() {
    return (
        <div className="p-6 rounded-3xl border border-white/10 bg-black/40 animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/5" />
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
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth/signin");
    }

    const isDemoUser = session.user.email === "demo@cloudzz.dev";
    // Force founder view for demo user
    const isFounder = session.user.role === "FOUNDER" || isDemoUser;

    let stats: any, activity: any, growthData: any, founderStats: any;

    if (isDemoUser) {
        const { DEMO_FOUNDER_STATS, DEMO_GROWTH_DATA } = await import("@/lib/demo-data");
        // Mock data for demo user
        stats = null; // Not used for founder view
        activity = [];
        growthData = DEMO_GROWTH_DATA;
        founderStats = DEMO_FOUNDER_STATS;
    } else {
        [stats, activity, growthData, founderStats] = await Promise.all([
            getDashboardStats(session.user.id),
            getRecentActivity(session.user.id),
            getGrowthMetrics("month", session.user.id),
            isFounder ? getFounderStats(session.user.id) : Promise.resolve(null)
        ]);
    }

    const statsCards = stats ? [
        { name: "Connections", value: stats.connections.toString(), icon: Users, color: "#818cf8" },
        { name: "Startups", value: stats.startups.toString(), icon: Rocket, color: "#a855f7" },
        { name: "Investors", value: stats.investors.toString(), icon: Briefcase, color: "#ec4899" },
        { name: "Growth", value: stats.growth, icon: TrendingUp, color: "#10b981" },
    ] : [];

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
                        Welcome, {session.user.name?.split(" ")[0] || "there"}!
                    </h1>
                    <p className="text-lg text-zinc-500">
                        {isFounder
                            ? "Here is your startup's performance overview."
                            : "Explore your network and track your growth."}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/messages"
                        className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all relative"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Conditional Dashboard Rendering */}
            {isFounder ? (
                <FounderDashboard stats={founderStats} growthData={growthData} />
            ) : (
                <>
                    {/* Access & Network Stats */}
                    <Suspense fallback={<StatsLoadingSkeleton />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {statsCards.map((stat) => (
                                <StatCard
                                    key={stat.name}
                                    title={stat.name}
                                    value={stat.value}
                                    icon={stat.icon}
                                    color={stat.color}
                                />
                            ))}
                        </div>
                    </Suspense>

                    {/* Growth Analytics (Network) */}
                    <GrowthDashboard initialData={growthData} />
                </>
            )}

            {/* Quick Actions & Messaging Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.name} href={action.href}>
                                    <GlassCard className="p-5 border-white/10 bg-black/40 hover:bg-white/5 transition-all group cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="font-bold text-white">{action.name}</span>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </GlassCard>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Recent Activity</h2>
                    <Suspense fallback={<ActivityLoadingSkeleton />}>
                        <GlassCard className="p-6 border-white/10 bg-black/40 min-h-[280px]">
                            {activity.length > 0 ? (
                                <div className="space-y-2">
                                    {activity.map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                {item.icon || "📌"}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium text-sm">{item.message}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{getRelativeTime(item.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-zinc-500 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <Activity className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">No activity yet</p>
                                        <p className="text-sm">Start connecting with people to see updates!</p>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </Suspense>
                </div>
            </div>

            {/* Feature Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/dashboard/messages">
                    <GlassCard className="p-8 border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent hover:border-indigo-500/30 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MessageSquare className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="p-4 rounded-2xl bg-indigo-500/20 w-fit">
                                <MessageSquare className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Messenger</h3>
                                <p className="text-zinc-400">Directly collaborate with founders and investors across the network.</p>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-400 font-bold">
                                Go to messages <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/dashboard/payments">
                    <GlassCard className="p-8 border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent hover:border-emerald-500/30 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Send className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="p-4 rounded-2xl bg-emerald-500/20 w-fit">
                                <Send className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Wallet</h3>
                                <p className="text-zinc-400">Securely handle funding, payouts, and digital asset transactions.</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                Manage payments <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </GlassCard>
                </Link>
            </div>
        </div>
    );
}

import { Activity } from "lucide-react";
