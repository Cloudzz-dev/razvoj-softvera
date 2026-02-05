"use client";

import React from "react";
import { GlassCard } from "./GlassCard";
import { LucideIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    icon?: LucideIcon;
    data?: { value: number }[];
    color?: string;
    trend?: "up" | "down";
    trendValue?: string;
    className?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    data,
    color = "#ffffff",
    trend,
    trendValue,
    className,
}: StatCardProps) {
    return (
        <GlassCard className={cn("p-0 flex flex-col relative overflow-hidden group min-h-[160px] bg-black/40 border-white/10", className)}>
            <div className="p-6 pb-0 z-10 relative">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">{title}</p>
                    {Icon && <Icon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />}
                </div>
                <h4 className="text-3xl font-bold text-white tracking-tight">{value}</h4>
                {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
                {trend && trendValue && (
                    <div className={cn(
                        "text-xs mt-3 flex items-center gap-1 font-medium",
                        trend === "up" ? "text-emerald-400" : "text-rose-400"
                    )}>
                        <span>{trend === "up" ? "↑" : "↓"}</span>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            
            {data && (
                <div className="absolute bottom-0 left-0 right-0 h-16 w-full opacity-30 group-hover:opacity-60 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`color-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={color} 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill={`url(#color-${title.replace(/\s+/g, '-')})`} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </GlassCard>
    );
}