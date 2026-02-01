"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, DollarSign, Flame, Rocket } from "lucide-react";

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
    growthData: any;
}

export function FounderDashboard({ stats, growthData }: FounderDashboardProps) {
    if (!stats) {
        return (
            <div className="p-8 text-center text-zinc-400">
                <GlassCard className="p-12 border-white/10 bg-black/40 backdrop-blur-xl space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mx-auto">
                        <Rocket size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Startup Profile Incomplete</h2>
                        <p className="text-zinc-500">Complete your startup profile to unlock Founder Analytics and track your growth metrics.</p>
                    </div>
                    <button className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all">
                        Complete Profile
                    </button>
                </GlassCard>
            </div>
        );
    }

    const formattedBurnRate = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
    }).format(stats.burnRate);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{stats.companyName}</h2>
                    <div className="flex items-center gap-3">
                        <Badge variant="indigo" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                            {stats.stage}
                        </Badge>
                        <span className="text-zinc-600">•</span>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
                            <Users size={14} />
                            {stats.teamSize} Core Members
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Funds Raised"
                    value={stats.raised}
                    icon={DollarSign}
                    color="#10b981"
                    trend="up"
                    trendValue="Seed Round"
                />
                <StatCard
                    title="Active Users"
                    value={stats.activeUsers.toLocaleString()}
                    icon={Users}
                    color="#818cf8"
                    trend="up"
                    trendValue="Real-time"
                    data={growthData?.active_users?.slice(-10)}
                />
                <StatCard
                    title="Monthly Burn"
                    value={formattedBurnRate}
                    icon={Flame}
                    color="#f43f5e"
                    trend="down"
                    trendValue="Operational"
                />
                <StatCard
                    title="Runway"
                    value={stats.runway}
                    icon={Activity}
                    color="#f59e0b"
                    trend="up"
                    trendValue="Healthy"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    data={growthData?.active_users || []} 
                    title="User Traction" 
                    description="Daily active users over the last 30 days"
                    type="area" 
                    color="#818cf8" 
                    height={320} 
                />
                <ChartCard 
                    data={growthData?.revenue || []} 
                    title="Revenue Growth" 
                    description="Monthly recurring revenue (MRR)"
                    type="bar" 
                    color="#10b981" 
                    valuePrefix="$"
                    height={320} 
                />
            </div>
        </div>
    );
}
