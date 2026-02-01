"use client";

import React from "react";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, Area, AreaChart 
} from "recharts";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
    date: string;
    value: number;
    [key: string]: any;
}

interface ChartCardProps {
    data: ChartDataPoint[];
    title: string;
    description?: string;
    type?: "line" | "bar" | "area";
    color?: string;
    valuePrefix?: string;
    height?: number;
    className?: string;
}

export function ChartCard({
    data,
    title,
    description,
    type = "area",
    color = "#ffffff",
    valuePrefix = "",
    height = 300,
    className,
}: ChartCardProps) {
    
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                        {payload[0].payload.date}
                    </p>
                    <p className="text-white font-bold text-lg">
                        {valuePrefix}{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        if (type === "bar") {
            return (
                <BarChart data={data}>
                    <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="0" />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }}
                        tickFormatter={(v) => `${valuePrefix}${v >= 1000 ? v/1000 + 'k' : v}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
            );
        }

        if (type === "line") {
            return (
                <LineChart data={data}>
                    <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="0" />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }}
                        tickFormatter={(v) => `${valuePrefix}${v >= 1000 ? v/1000 + 'k' : v}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={color} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                    />
                </LineChart>
            );
        }

        return (
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="0" />
                <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }}
                    tickFormatter={(v) => `${valuePrefix}${v >= 1000 ? v/1000 + 'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill={`url(#color-${title})`} 
                />
            </AreaChart>
        );
    };

    return (
        <GlassCard className={cn("p-8 bg-black/40 border-white/10 flex flex-col space-y-6", className)}>
            <div className="flex flex-col space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                {description && <p className="text-sm text-zinc-500">{description}</p>}
            </div>
            <div className="w-full" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
