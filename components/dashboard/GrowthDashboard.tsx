"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
// import { MetricsChart } from "@/components/ui/MetricsChart"; // Replaced with dynamic import
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";

// Lazy load heavy chart component
const MetricsChart = dynamic(
    () => import("@/components/ui/MetricsChart").then((mod) => mod.MetricsChart),
    {
        loading: () => <div className="h-[280px] w-full bg-white/5 animate-pulse rounded-xl" />,
        ssr: false
    }
);
import toast from "react-hot-toast";

type TimeRange = "week" | "month" | "quarter" | "year";

interface GrowthData {
    connections: { date: string; value: number }[];
    revenue: { date: string; value: number }[];
    users: { date: string; value: number }[];
    active_users?: { date: string; value: number }[];
}

const initialGrowthData: GrowthData = {
    connections: [],
    revenue: [],
    users: [],
    active_users: [],
};

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (res.status === 401 || res.status === 403) {
        // [WAR ROOM V2] Graceful handling of session expiry
        // If the API returns unauthorized (session died), redirect to login
        // to prevent the "Live Pulse" from crashing or showing stale data.
        window.location.href = "/login";
        throw new Error("Session expired");
    }
    if (!res.ok) {
        throw new Error("Failed to fetch data");
    }
    return res.json();
};

export function GrowthDashboard({ initialData }: { initialData?: GrowthData }) {
    const [timeRange, setTimeRange] = useState<TimeRange>("month");

    // [WAR ROOM V2] Live Pulse
    // Replaced useEffect with useSWR for real-time updates and automatic revalidation.
    // The dashboard will now stay in sync if the user leaves the tab open.
    const { data: swrData, error, isLoading: isSwrLoading } = useSWR<GrowthData>(
        `/api/growth?timeRange=${timeRange}`,
        fetcher,
        {
            fallbackData: initialData,
            refreshInterval: 30000, // Poll every 30s to keep the pulse alive
            revalidateOnFocus: true,
        }
    );

    const data = swrData || initialGrowthData;
    const isLoading = isSwrLoading && !swrData;

    // Show error toast only once if error occurs
    useEffect(() => {
        if (error) {
            console.error(error);
            toast.error("Could not load growth analytics.");
        }
    }, [error]);

    const { connectionsChange, revenueChange, activeUsersChange } = useMemo(() => {
        const connectionsData = data.connections || [];
        const revenueData = data.revenue || [];
        const activeUsersData = data.active_users || [];

        const calcChange = (d: { value: number }[]) =>
            d.length > 1 ? ((d[d.length - 1].value - d[0].value) / d[0].value) * 100 : 0;

        return {
            connectionsChange: calcChange(connectionsData),
            revenueChange: calcChange(revenueData),
            activeUsersChange: calcChange(activeUsersData),
        };
    }, [data]);

    const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
        setTimeRange(newRange);
    }, []);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">Growth Analytics</h2>
                    {/* Live Indicator */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-green-400">LIVE</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(["week", "month", "quarter", "year"] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => handleTimeRangeChange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range ? "bg-indigo-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    icon={Users}
                    title="Total Connections"
                    value={data.connections[data.connections.length - 1]?.value.toFixed(0) || "0"}
                    change={connectionsChange}
                    color="indigo"
                />
                <SummaryCard
                    icon={DollarSign}
                    title="Platform Revenue"
                    value={`$${((data.revenue[data.revenue.length - 1]?.value || 0) / 1000).toFixed(1)}K`}
                    change={revenueChange}
                    color="green"
                />
                <SummaryCard
                    icon={TrendingUp}
                    title="Active Users"
                    value={data.active_users?.[data.active_users.length - 1]?.value.toFixed(0) || "0"}
                    change={activeUsersChange}
                    color="pink"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricsChart data={data.revenue} title="Revenue Growth" type="line" color="#10b981" valuePrefix="$" height={280} />
                <MetricsChart data={data.active_users || []} title="Active Users (Real-Time)" type="area" color="#ec4899" height={280} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricsChart data={data.connections} title="Network Connections" type="area" color="#818cf8" height={280} />
                <MetricsChart data={data.users} title="Startup Members" type="bar" color="#8b5cf6" height={280} />
            </div>
        </div>
    );
}


const SummaryCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className={`p-6 rounded-xl bg-gradient-to-br from-${color}-500/10 to-purple-500/5 border border-white/10 backdrop-blur-md`}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 text-${color}-400`} />
                <span className="text-sm font-medium text-zinc-400">{title}</span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(change || 0).toFixed(1)}%
            </div>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
    </div>
);

const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="h-8 bg-white/10 rounded-md w-1/3"></div>
            <div className="flex gap-2">
                <div className="h-10 bg-white/10 rounded-lg w-20"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-white/10 rounded-xl"></div>
            <div className="h-28 bg-white/10 rounded-xl"></div>
            <div className="h-28 bg-white/10 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-white/10 rounded-xl"></div>
            <div className="h-72 bg-white/10 rounded-xl"></div>
        </div>
    </div>
);
