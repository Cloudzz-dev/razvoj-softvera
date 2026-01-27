"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap } from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

const allActivities = [
    { id: 1, text: "Alex Chen joined as a Developer", time: "just now" },
    { id: 2, text: "NexusAI raised $2.5M Seed Round", time: "1m ago" },
    { id: 3, text: "Sarah V. connected with Mike R.", time: "2m ago" },
    { id: 4, text: "New Thread: 'Future of LLMs'", time: "5m ago" },
    { id: 5, text: "Payment processed for $1,200", time: "12m ago" },
    { id: 6, text: "Marcus L. updated his portfolio", time: "15m ago" },
    { id: 7, text: "GreenTech Co. posted a new job", time: "22m ago" },
    { id: 8, text: "New Startup 'Veloc' registered", time: "30m ago" },
];

const trendingTags = ["Generative AI", "DeFi", "ClimateTech", "HealthOS", "DevTools", "SpaceTech"];

const fundingData = [
    { value: 10 }, { value: 25 }, { value: 18 }, { value: 30 }, { value: 45 }, { value: 35 }, { value: 55 }, { value: 50 }, { value: 70 }, { value: 65 }, { value: 85 }, { value: 90 }
];

const userData = [
    { value: 20 }, { value: 30 }, { value: 45 }, { value: 40 }, { value: 55 }, { value: 60 }, { value: 50 }, { value: 65 }, { value: 75 }, { value: 80 }, { value: 95 }, { value: 100 }
];

export function NetworkPulse() {
    const [activities, setActivities] = useState(allActivities.slice(0, 4));

    useEffect(() => {
        const interval = setInterval(() => {
            setActivities(prev => {
                // Find the next item from the master list
                const firstId = prev[0].id;
                const currentMasterIndex = allActivities.findIndex(a => a.id === firstId);
                const nextIndex = (currentMasterIndex - 1 + allActivities.length) % allActivities.length;
                const newActivity = allActivities[nextIndex];
                
                // Prepend new item, remove last item to maintain window size
                return [newActivity, ...prev.slice(0, 3)];
            });
        }, 3000); // Fast update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col justify-center max-w-4xl mx-auto p-4 lg:p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full md:max-h-[500px]">
                
                {/* Live Activity Feed - Large Card */}
                <GlassCard className="col-span-1 md:col-span-2 row-span-2 p-6 flex flex-col relative overflow-hidden bg-black/40 backdrop-blur-xl border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-white" />
                            Network Activity
                        </h3>
                        <div className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse"></span>
                            <span className="text-xs text-zinc-400 font-mono">LIVE</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-hidden relative">
                        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />
                        <AnimatePresence mode="popLayout" initial={false}>
                            {activities.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-200 font-medium">{item.text}</p>
                                        <p className="text-xs text-zinc-500">{item.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </GlassCard>

                {/* Stat Card 1 - Total Raised */}
                <GlassCard className="p-0 flex flex-col relative overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 group min-h-[160px]">
                    <div className="p-6 pb-0 z-10 relative">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Facilitated Funding</p>
                        <h4 className="text-3xl font-bold text-white tracking-tight">$12.5M+</h4>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-24 w-full opacity-50 group-hover:opacity-80 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fundingData}>
                                <defs>
                                    <linearGradient id="colorFunding" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)' }} content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#ffffff" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorFunding)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Stat Card 2 - Active Members */}
                <GlassCard className="p-0 flex flex-col relative overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 group min-h-[160px]">
                    <div className="p-6 pb-0 z-10 relative">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Active Founders & Devs</p>
                        <h4 className="text-3xl font-bold text-white tracking-tight">8,400+</h4>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-24 w-full opacity-50 group-hover:opacity-80 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={userData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)' }} content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#d4d4d8" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorUsers)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Trending Tags - Wide Card */}
                <GlassCard className="col-span-1 md:col-span-3 p-8 bg-black/40 backdrop-blur-xl border-white/10 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trending Ecosystems</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {trendingTags.map((tag, i) => (
                            <motion.span
                                key={tag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="px-4 py-2 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                            >
                                #{tag}
                            </motion.span>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-lg shadow-xl">
                <p className="text-white text-xs font-bold">{payload[0].value}</p>
            </div>
        );
    }
    return null;
};