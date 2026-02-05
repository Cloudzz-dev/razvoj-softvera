"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/payment-utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function InvestorDashboard() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [invested, setInvested] = useState(0);
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [dealFlow, setDealFlow] = useState<any[]>([]);
    const [growthData, setGrowthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, txRes, startupsRes, growthRes] = await Promise.all([
                    fetch("/api/dashboard/stats"),
                    fetch("/api/transactions?filter=sent"),
                    fetch("/api/v1/startups"),
                    fetch("/api/growth?timeRange=year"),
                ]);

                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    setProfile(stats.profile || {});
                }

                if (txRes.ok) {
                    const transactions = await txRes.json();
                    const totalInvested = transactions
                        .filter((tx: any) => tx.status === "COMPLETED")
                        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
                    setInvested(totalInvested);
                }

                if (startupsRes.ok) {
                    const startups = await startupsRes.json();
                    setPortfolio(startups.data.slice(0, 3));
                    setDealFlow(startups.data.slice(3, 5));
                }

                if (growthRes.ok) {
                    const growth = await growthRes.json();
                    setGrowthData(growth);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchData();
        }
    }, [session]);

    if (loading) {
        return <div className="text-white">Loading...</div>;
    }

    const firm = profile?.firm || "Independent Angel";
    const focus = profile?.focus || "Generalist";
    const checkSize = profile?.checkSize || "N/A";
    const location = profile?.location || "Remote";
    const portfolioCount = profile?.portfolio || 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Investor Dashboard</h1>
                <p className="text-zinc-400">Welcome back, {session?.user?.name}!</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(invested)}</p>
                    <p className="text-sm text-zinc-400">Total Invested</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-indigo-500/10">
                            <Briefcase className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{portfolioCount}</p>
                    <p className="text-sm text-zinc-400">Portfolio Companies</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <Users className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">8</p>
                    <p className="text-sm text-zinc-400">Active Deals</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <TrendingUp className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">3.2x</p>
                    <p className="text-sm text-zinc-400">Avg ROI</p>
                </GlassCard>
            </div>

            {/* Investment Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <h2 className="text-xl font-semibold text-white mb-4">Investment Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Firm</p>
                            <p className="text-white font-medium">{firm}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Focus Area</p>
                            <p className="text-white font-medium">{focus}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Check Size</p>
                            <p className="text-white font-medium">{checkSize}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Location</p>
                            <p className="text-white font-medium">{location}</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Portfolio Performance */}
                {growthData && (
                    <ChartCard
                        data={growthData.revenue}
                        title="Portfolio Value Growth"
                        description="Historical growth of assets"
                        type="line"
                        color="#10b981"
                        valuePrefix="$"
                        height={320}
                    />
                )}
            </div>

            {/* Portfolio Companies */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Portfolio Companies</h2>
                    <Link
                        href="/dashboard/startups"
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        View all
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {portfolio.map((startup: any) => (
                        <GlassCard
                            key={startup.id}
                            className="p-4 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-between min-h-[180px]"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white truncate text-sm">{startup.name}</h3>
                                    <Badge variant="outline" className="text-[8px] py-0 px-1 opacity-60">
                                        {startup.stage}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">{startup.pitch}</p>
                            </div>
                            <div className="space-y-1.5 pt-3 border-t border-white/5">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-500 uppercase font-bold tracking-widest">Raised</span>
                                    <span className="text-white font-black">{startup.raised || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-500 uppercase font-bold tracking-widest">Team</span>
                                    <span className="text-white font-black">{startup.team || 1}</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Deal Flow */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Recent Deal Flow</h2>
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="space-y-3">
                        {dealFlow.map((startup: any) => (
                            <div
                                key={startup.id}
                                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{startup.logo || "🚀"}</div>
                                    <div>
                                        <h3 className="font-semibold text-white">{startup.name}</h3>
                                        <p className="text-sm text-zinc-400">{startup.pitch}</p>
                                    </div>
                                </div>
                                <Button>
                                    Review
                                </Button>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
