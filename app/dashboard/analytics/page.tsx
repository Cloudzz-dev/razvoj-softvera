"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center min-h-[60vh]">
            <GlassCard variant="dark" className="p-12 flex flex-col items-center text-center max-w-lg border-indigo-500/20">
                <div className="p-4 rounded-full bg-indigo-500/10 mb-6">
                    <BarChart3 className="w-12 h-12 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Analytics Coming Soon</h2>
                <p className="text-zinc-400">
                    We are building a comprehensive analytics suite to help you track your startup's performance, user engagement, and growth metrics.
                </p>
            </GlassCard>
        </div>
    );
}
