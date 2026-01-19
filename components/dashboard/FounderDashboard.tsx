
"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Users, DollarSign, Activity, Flame } from "lucide-react";
import { useMemo } from "react";

interface FounderStats {
    companyName: string;
    raised: string;
    stage: string;
    teamSize: number;
    activeUsers: number;
    burnRate: number;
    runway: string;
}

interface FounderDashboardProps {
    stats: FounderStats | null;
    growthData: any; // Using the existing structure from GrowthDashboard
}

export function FounderDashboard({ stats, growthData }: FounderDashboardProps) {
    if (!stats) {
        return (
            <div className="p-8 text-center text-zinc-400">
                <GlassCard className="p-8 border-white/10 bg-black/40">
                    <h2 className="text-xl font-bold text-white mb-2">Startup Profile Incomplete</h2>
                    <p>Complete your startup profile to unlock Founder Analytics.</p>
                </GlassCard>
            </div>
        );
    }

    const formattedBurnRate = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.burnRate);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{stats.companyName}</h2>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                            {stats.stage}
                        </span>
                        <span>•</span>
                        <span>{stats.teamSize} Team Members</span>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                    title="Funds Raised"
                    value={stats.raised}
                    icon={DollarSign}
                    color="green"
                    trend="+0% this month"
                />
                <SummaryCard
                    title="Active Users"
                    value={stats.activeUsers.toLocaleString()}
                    icon={Users}
                    color="blue"
                    trend="Real-time"
                />
                <SummaryCard
                    title="Monthly Burn"
                    value={formattedBurnRate}
                    icon={Flame}
                    color="red"
                    trend="Est based on team"
                />
                <SummaryCard
                    title="Runway"
                    value={stats.runway}
                    icon={Activity}
                    color="yellow"
                    trend="Healthy"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Users Chart */}
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Active Users (Real-Time)</h3>
                            <p className="text-sm text-zinc-400">Daily active users over time</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData?.active_users || []}>
                                <defs>
                                    <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#818cf8"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorActiveUsers)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Revenue Chart (Placeholder/Simulated) */}
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Revenue</h3>
                            <p className="text-sm text-zinc-400">Monthly revenue</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={growthData?.revenue || []}>
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <GlassCard className="p-6 border-white/10 bg-black/40">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                    <Icon className={`w-6 h-6 text-${color}-400`} />
                </div>
                {trend && (
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-sm text-zinc-400">{title}</p>
        </GlassCard>
    );
}
