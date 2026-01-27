"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { GlassCard } from "./GlassCard";

interface ChartDataPoint {
    date: string;
    value: number;
}

interface MetricsChartProps {
    data: ChartDataPoint[];
    title: string;
    type?: "line" | "bar" | "area";
    color?: string;
    valuePrefix?: string;
    height?: number;
}

const chartComponents = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart,
};

const chartElements = {
    line: (color: string) => <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 6 }} />,
    bar: (color: string) => <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />,
    area: (color: string) => (
        <>
            <defs>
                <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${color})`} />
        </>
    ),
};

export function MetricsChart({
    data,
    title,
    type = "line",
    color = "#818cf8",
    valuePrefix = "",
    height = 300,
}: MetricsChartProps) {
    const ChartComponent = chartComponents[type];
    const ChartElement = chartElements[type](color);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px'
                    }}
                    className="p-3 shadow-2xl"
                >
                    <p className="text-zinc-400 text-xs mb-1">{payload[0].payload.date}</p>
                    <p className="text-white font-semibold text-sm">
                        {valuePrefix}{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <GlassCard variant="medium" className="p-6" aria-label={title}>
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height} debounce={50}>
                <ChartComponent data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${valuePrefix}${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} />
                    {ChartElement}
                </ChartComponent>
            </ResponsiveContainer>
        </GlassCard>
    );
}
