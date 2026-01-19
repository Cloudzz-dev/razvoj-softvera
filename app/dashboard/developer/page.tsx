"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricsChart } from "@/components/ui/MetricsChart";
import { Code, Briefcase, DollarSign, Star, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/payment-utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DeveloperDashboard() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [earnings, setEarnings] = useState(0);
    const [gigs, setGigs] = useState<any[]>([]);
    const [growthData, setGrowthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, txRes, startupsRes, growthRes] = await Promise.all([
                    fetch("/api/dashboard/stats"),
                    fetch("/api/transactions?filter=received"),
                    fetch("/api/v1/startups"),
                    fetch("/api/growth?timeRange=year"),
                ]);

                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    setProfile(stats.profile || {});
                }

                if (txRes.ok) {
                    const transactions = await txRes.json();
                    const totalEarnings = transactions
                        .filter((tx: any) => tx.status === "COMPLETED")
                        .reduce((sum: number, tx: any) => sum + tx.netAmount, 0);
                    setEarnings(totalEarnings);
                }

                if (startupsRes.ok) {
                    const startups = await startupsRes.json();
                    setGigs(startups.data.slice(0, 3));
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

    // Fallback values if profile data is missing
    const skills = profile?.skills || [];
    const role = profile?.role || "Developer"; // Default role?
    const experience = profile?.experience || "N/A";
    const rate = profile?.rate || "N/A";
    const location = profile?.location || "Remote";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Developer Dashboard</h1>
                <p className="text-zinc-400">Welcome back, {session?.user?.name}!</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-indigo-500/10">
                            <Code className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{skills.length}</p>
                    <p className="text-sm text-zinc-400">Skills</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(earnings)}</p>
                    <p className="text-sm text-zinc-400">Total Earnings</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <Briefcase className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">3</p>
                    <p className="text-sm text-zinc-400">Active Projects</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <Star className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">4.9</p>
                    <p className="text-sm text-zinc-400">Rating</p>
                </GlassCard>
            </div>

            {/* Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Role</p>
                            <p className="text-white font-medium">{role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Experience</p>
                            <p className="text-white font-medium">{experience}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Rate</p>
                            <p className="text-white font-medium">{rate}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Location</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <MapPin className="w-4 h-4" />
                                {location}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill: string) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Earnings Chart */}
                {growthData && (
                    <MetricsChart
                        data={growthData.revenue}
                        title="Monthly Earnings"
                        type="area"
                        color="#10b981"
                        valuePrefix="$"
                        height={280}
                    />
                )}
            </div>

            {/* Available Gigs */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Available Opportunities</h2>
                    <Link
                        href="/dashboard/startups"
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        View all
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {gigs.map((startup: any) => (
                        <GlassCard
                            key={startup.id}
                            className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <div className="text-3xl">{startup.logo || "🚀"}</div>
                                <div>
                                    <h3 className="font-semibold text-white">{startup.name}</h3>
                                    <p className="text-sm text-zinc-400">{startup.stage}</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-300 mb-4">{startup.pitch}</p>
                            <button className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
                                Apply Now
                            </button>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
