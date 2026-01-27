"use client";

import React, { useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useEquityStore } from './store';
import { SimulatorControls } from './SimulatorControls';
import { formatCurrency, formatPercentage } from '@/lib/math/dilution';
import { GlassCard } from '@/components/ui/GlassCard';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#a855f7']; // Indigo, Emerald, Purple

export function EquitySimulator() {
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        postMoneyValuation,
        investorOwnership,
        founderDilutedOwnership,
        investmentAmount,
        preMoneyValuation
    } = useEquityStore();

    if (!mounted) return <div className="h-[600px] w-full bg-zinc-900/50 animate-pulse rounded-xl" />;

    // Data for Pie Chart
    const data = [
        { name: 'Founders', value: founderDilutedOwnership },
        { name: 'Investors', value: investorOwnership },
    ];

    const copyShareLink = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('val', preMoneyValuation.toString());
        url.searchParams.set('inv', investmentAmount.toString());
        navigator.clipboard.writeText(url.toString())
            .then(() => toast.success('Simulation link copied to clipboard!'))
            .catch(() => toast.error('Failed to copy link'));
    };

    return (
        <section className="py-12 w-full max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Controls & Stats */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white">Equity Calculator</h2>
                        <button
                            onClick={copyShareLink}
                            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Share Simulation"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    <SimulatorControls />

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <GlassCard variant="dark" className="p-4 text-center">
                            <p className="text-sm text-zinc-400 mb-1">Post-Money Valuation</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(postMoneyValuation)}</p>
                        </GlassCard>
                        <GlassCard variant="dark" className="p-4 text-center">
                            <p className="text-sm text-zinc-400 mb-1">Your Dilution</p>
                            <p className="text-xl font-bold text-rose-400">-{formatPercentage(investorOwnership)}</p>
                        </GlassCard>
                    </div>
                </div>

                {/* Right Column: Visualization */}
                <GlassCard className="h-[500px]">
                    <div className="flex flex-col items-center justify-center relative h-full w-full">
                        <h3 className="absolute top-0 left-0 text-lg font-semibold text-white z-20">Cap Table Visualization</h3>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatPercentage(value)}
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Center Text Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                            <span className="text-3xl font-bold text-white">
                                {formatPercentage(founderDilutedOwnership)}
                            </span>
                            <span className="text-sm text-zinc-400">Founders</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </section>
    );
}
