"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console for debugging (consider sending to error tracking service)
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
            <GlassCard className="p-8 max-w-md text-center border-red-500/20 bg-red-500/5">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-zinc-400 mb-6">
                    We encountered an error loading your dashboard. This has been logged and we&apos;ll look into it.
                </p>
                {error.digest && (
                    <p className="text-xs text-zinc-500 mb-4 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
