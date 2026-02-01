"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { Button } from "@/components/ui/button";
import { Rocket, Users, DollarSign, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";

export default function StartupDashboard() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [investors, setInvestors] = useState<any[]>([]);
    const [growthData, setGrowthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, devsRes, investorsRes, growthRes] = await Promise.all([
                    fetch("/api/dashboard/stats"),
                    fetch("/api/network?role=DEVELOPER"),
                    fetch("/api/network?role=INVESTOR"),
                    fetch("/api/growth?timeRange=year"),
                ]);

                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    setProfile(stats.profile || {});
                }

                if (devsRes.ok) {
                    const devs = await devsRes.json();
                    setDevelopers(devs.slice(0, 2));
                }

                if (investorsRes.ok) {
                    const invs = await investorsRes.json();
                    setInvestors(invs.slice(0, 2));
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

    // Use profile data or defaults
    const startupName = profile?.companyName || session?.user?.name || "My Startup";
    const pitch = profile?.bio || "Building the future of tech.";
    const website = profile?.website || "https://example.com";
    const stage = profile?.stage || "Seed";
    const raised = profile?.raised || "$0";
    const teamSize = profile?.teamSize || 1;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🚀</span>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{startupName}</h1>
                </div>
                <p className="text-zinc-400">{pitch}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{raised}</p>
                    <p className="text-sm text-zinc-400">Total Raised</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-indigo-500/10">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{teamSize}</p>
                    <p className="text-sm text-zinc-400">Team Members</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <Rocket className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{stage}</p>
                    <p className="text-sm text-zinc-400">Stage</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <TrendingUp className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">+45%</p>
                    <p className="text-sm text-zinc-400">Growth (MoM)</p>
                </GlassCard>
            </div>

            {/* Charts */}
            {growthData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                        data={growthData.users}
                        title="User Retention"
                        description="Daily active users over time"
                        type="area"
                        color="#8b5cf6"
                        height={300}
                    />
                    <ChartCard
                        data={growthData.revenue}
                        title="Monthly Revenue"
                        description="Revenue streams in USD"
                        type="bar"
                        color="#10b981"
                        valuePrefix="$"
                        height={300}
                    />
                </div>
            )}

            {/* Startup Details */}
            <GlassCard className="p-6 border-white/10 bg-black/40">
                <h2 className="text-xl font-semibold text-white mb-4">Startup Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-zinc-400 mb-1">Founded By</p>
                        <p className="text-white font-medium">{session?.user?.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400 mb-1">Website</p>
                        <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                            {website.replace("https://", "")}
                        </a>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400 mb-1">Wallet Address</p>
                        <p className="text-white font-mono text-xs">0x...</p>
                    </div>
                </div>
            </GlassCard>

            {/* Team Recommendations */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Recommended Developers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {developers.map((dev: any) => (
                        <GlassCard
                            key={dev.id}
                            className="p-4 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-between min-h-[180px]"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-white text-sm truncate">{dev.name}</h3>
                                    <span className="px-1.5 py-0 bg-green-500/20 text-green-400 text-[8px] font-black uppercase rounded">
                                        LIVE
                                    </span>
                                </div>
                                <div className="space-y-1.5 mb-3">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Rate</span>
                                        <span className="text-white font-black">$80/hr</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {(dev.profile?.skills || ["React", "Node.js"]).slice(0, 2).map((skill: string) => (
                                            <span key={skill} className="px-1 py-0 rounded bg-white/5 text-zinc-400 text-[8px] border border-white/5 font-bold uppercase tracking-tighter">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg">
                                Contact
                            </button>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Interested Investors */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Interested Investors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {investors.map((investor: any) => (
                        <GlassCard
                            key={investor.id}
                            className="p-4 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-between min-h-[180px]"
                        >
                            <div>
                                <h3 className="font-bold text-white text-sm truncate mb-1">{investor.name}</h3>
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 truncate">
                                    {investor.profile?.firm || "Angel"}
                                </p>
                                <div className="space-y-1.5 mb-3">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Focus</span>
                                        <span className="text-white font-black truncate max-w-[80px]">{investor.profile?.focus || "Tech"}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Checks</span>
                                        <span className="text-white font-black truncate max-w-[80px]">{investor.profile?.checkSize || "$50k"}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg">
                                Link
                            </button>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
