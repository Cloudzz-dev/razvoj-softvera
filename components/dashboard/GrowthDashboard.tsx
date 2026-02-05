"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

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
        window.location.href = "/login";
        throw new Error("Session expired");
    }
    if (!res.ok) {
        throw new Error("Failed to fetch data");
    }
    return res.json();
};

export function GrowthDashboard({ initialData }: { initialData?: GrowthData }) {
    const { data: session } = useSession();
    const [timeRange, setTimeRange] = useState<TimeRange>("month");
    const [liveData, setLiveData] = useState<GrowthData | null>(null);

    const { data: swrData, error, isLoading: isSwrLoading } = useSWR<GrowthData>(
        `/api/growth?timeRange=${timeRange}`,
        fetcher,
        {
            fallbackData: initialData,
            refreshInterval: 30000,
            revalidateOnFocus: true,
        }
    );

    const data = liveData || swrData || initialGrowthData;
    const isLoading = isSwrLoading && !swrData;

    // Sync SWR data to local state for manipulation
    useEffect(() => {
        if (swrData) {
            setLiveData(swrData);
        }
    }, [swrData]);

    // Demo Mode: Real-time Simulation
    useEffect(() => {
        const isDemoUser = session?.user?.email === "demo@cloudzz.dev";
        if (!isDemoUser || !liveData?.active_users) return;

        const interval = setInterval(() => {
            setLiveData(prev => {
                if (!prev || !prev.active_users) return prev;
                
                const lastValue = prev.active_users[prev.active_users.length - 1].value;
                // Random fluctuation between -5 and +10 users
                const change = Math.floor(Math.random() * 15) - 5;
                const newValue = Math.max(10, lastValue + change);
                const newDate = new Date().toISOString();

                const newActiveUsers = [...prev.active_users, { date: newDate, value: newValue }];
                // Keep array size manageable
                if (newActiveUsers.length > 50) newActiveUsers.shift();

                return {
                    ...prev,
                    active_users: newActiveUsers
                };
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [session, liveData]); // Re-run if session or data structure availability changes

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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Growth Analytics</h2>
                    <Badge variant="green" dot className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        LIVE
                    </Badge>
                </div>
                <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
                    {(["week", "month", "quarter", "year"] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => handleTimeRangeChange(range)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${timeRange === range ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Users}
                    title="Total Connections"
                    value={data.connections[data.connections.length - 1]?.value.toFixed(0) || "0"}
                    trend={connectionsChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(connectionsChange).toFixed(1)}%`}
                    color="#818cf8"
                    data={data.connections.slice(-10)}
                />
                <StatCard
                    icon={DollarSign}
                    title="Platform Revenue"
                    value={`$${((data.revenue[data.revenue.length - 1]?.value || 0) / 1000).toFixed(1)}K`}
                    trend={revenueChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(revenueChange).toFixed(1)}%`}
                    color="#10b981"
                    data={data.revenue.slice(-10)}
                />
                <StatCard
                    icon={Activity}
                    title="Active Users"
                    value={data.active_users?.[data.active_users.length - 1]?.value.toFixed(0) || "0"}
                    trend={activeUsersChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(activeUsersChange).toFixed(1)}%`}
                    color="#ec4899"
                    data={data.active_users?.slice(-10)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    data={data.revenue} 
                    title="Revenue Stream" 
                    description="Monthly revenue in USD"
                    type="area" 
                    color="#10b981" 
                    valuePrefix="$" 
                    height={300} 
                />
                <ChartCard 
                    data={data.active_users || []} 
                    title="User Engagement" 
                    description="Daily active users across platform"
                    type="area" 
                    color="#ec4899" 
                    height={300} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    data={data.connections} 
                    title="Network Expansion" 
                    description="New connections established"
                    type="line" 
                    color="#818cf8" 
                    height={300} 
                />
                <ChartCard 
                    data={data.users} 
                    title="Ecosystem Growth" 
                    description="Total registered members"
                    type="bar" 
                    color="#a855f7" 
                    height={300} 
                />
            </div>
        </div>
    );
}

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="h-8 bg-white/5 rounded-full w-1/4"></div>
            <div className="h-10 bg-white/5 rounded-full w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white/5 rounded-3xl"></div>
            <div className="h-32 bg-white/5 rounded-3xl"></div>
            <div className="h-32 bg-white/5 rounded-3xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-white/5 rounded-3xl"></div>
            <div className="h-80 bg-white/5 rounded-3xl"></div>
        </div>
    </div>
);
