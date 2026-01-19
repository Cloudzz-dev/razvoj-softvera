"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, UserPlus, Eye, Activity, TrendingUp, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SummaryData {
    totalUsers: number;
    newUsersToday: number;
    totalContentViews: number;
    activeUsersToday: number;
    telemetry?: {
        pageViews: number;
        clicks: number;
        avgDwellTime: number;
    };
    generatedAt: string;
}



interface TimeseriesData {
    metric: string;
    startDate: string;
    endDate: string;
    data: Array<{ date: string; value: number }>;
}


function CreatorDashboardContent() {
    const { status } = useSession();
    const router = useRouter();
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            fetchData();
        }
    }, [status, router]);

    async function fetchData() {
        try {
            setLoading(true);
            setError(null);

            const [summaryRes, timeseriesRes] = await Promise.all([
                fetch("/api/creator/analytics/summary"),
                fetch("/api/creator/analytics/timeseries?metric=newUsersCount"),
            ]);

            if (!summaryRes.ok) {
                if (summaryRes.status === 403) {
                    setError("Access denied. You need Creator/Admin role to view this dashboard.");
                    return;
                }
                throw new Error("Failed to fetch summary");
            }

            if (!timeseriesRes.ok) {
                throw new Error("Failed to fetch timeseries");
            }



            const summaryData = await summaryRes.json();
            const timeseriesData = await timeseriesRes.json();
            setSummary(summaryData);
            setTimeseries(timeseriesData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-white">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black p-8">
                <div className="max-w-6xl mx-auto">
                    <GlassCard className="p-8 border-red-500/30 bg-red-900/10">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Access Error</h1>
                        <p className="text-zinc-300 mb-6">{error}</p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </GlassCard>
                </div>
            </div>
        );
    }

    const maxValue = timeseries?.data ? Math.max(...timeseries.data.map(d => d.value), 1) : 1;

    return (
        <div className="min-h-screen bg-black p-8">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-purple-400" />
                            Creator Analytics
                        </h1>
                        <p className="text-zinc-400 mt-2">Platform metrics and insights</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                    >
                        Refresh Data
                    </button>
                </div>


                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlassCard className="p-6 border-white/10 bg-black/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Total Users</p>
                                <p className="text-3xl font-bold text-white">{summary?.totalUsers || 0}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 border-white/10 bg-black/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <UserPlus className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">New Users Today</p>
                                <p className="text-3xl font-bold text-white">{summary?.newUsersToday || 0}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 border-white/10 bg-black/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <Eye className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Total Content</p>
                                <p className="text-3xl font-bold text-white">{summary?.totalContentViews || 0}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 border-white/10 bg-black/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/20">
                                <Activity className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Active Today</p>
                                <p className="text-3xl font-bold text-white">{summary?.activeUsersToday || 0}</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Telemetry KPIs (Next Steps) */}
                <div className="grid grid-cols-1 gap-6">
                    <GlassCard className="p-6 border-white/10 bg-indigo-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-indigo-500/20">
                                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Migration to PostHog successful</h3>
                                    <p className="text-sm text-zinc-400">Advanced analytics, session recording, and heatmaps are now active.</p>
                                </div>
                            </div>
                            <a
                                href="https://eu.posthog.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors"
                            >
                                Open PostHog Dashboard
                            </a>
                        </div>
                    </GlassCard>
                </div>

                {/* Time Series Chart */}
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                New Users (Last 30 Days)
                            </h2>
                            <p className="text-sm text-zinc-400">Daily registration trend</p>
                        </div>
                    </div>

                    {timeseries?.data && timeseries.data.length > 0 ? (
                        <div className="space-y-4">
                            {/* Simple bar chart */}
                            <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
                                {timeseries.data.map((point, idx) => (
                                    <div
                                        key={idx}
                                        className="flex-1 min-w-[8px] flex flex-col items-center group relative"
                                    >
                                        <div
                                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all hover:from-purple-500 hover:to-purple-300"
                                            style={{
                                                height: `${Math.max((point.value / maxValue) * 100, 2)}%`,
                                            }}
                                        />
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                            {point.date}: {point.value} users
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* X-axis labels */}
                            <div className="flex justify-between text-xs text-zinc-500 px-1">
                                <span>{timeseries.startDate}</span>
                                <span>{timeseries.endDate}</span>
                            </div>

                            {/* Summary stats */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                                <div className="text-center">
                                    <p className="text-sm text-zinc-400">Total</p>
                                    <p className="text-lg font-bold text-white">
                                        {timeseries.data.reduce((sum, d) => sum + d.value, 0)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-zinc-400">Average/Day</p>
                                    <p className="text-lg font-bold text-white">
                                        {(timeseries.data.reduce((sum, d) => sum + d.value, 0) / timeseries.data.length).toFixed(1)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-zinc-400">Peak Day</p>
                                    <p className="text-lg font-bold text-white">
                                        {Math.max(...timeseries.data.map(d => d.value))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-zinc-500">
                            No data available for the selected period
                        </div>
                    )}
                </GlassCard>

                {/* Raw Telemetry Events */}
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Recent Telemetry (Migrated)</h2>
                            <p className="text-sm text-zinc-400">Events are now tracked in PostHog</p>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto font-mono text-xs">
                        <div className="py-8 text-center text-zinc-500 italic">
                            The raw ingestion log has been disabled. Please use the PostHog dashboard for real-time event monitoring.
                        </div>
                    </div>
                </GlassCard>

                {/* Footer */}
                <p className="text-center text-sm text-zinc-500">
                    Last updated: {summary?.generatedAt ? new Date(summary.generatedAt).toLocaleString() : "N/A"}
                </p>
            </div>
        </div>
    );
}

export default function CreatorDashboardPage() {
    return (
        <SessionProvider>
            <CreatorDashboardContent />
        </SessionProvider>
    );
}
