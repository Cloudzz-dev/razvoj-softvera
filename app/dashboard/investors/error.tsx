"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

    const buttonStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98]";
    const glassVariant = "bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 text-white";

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
                    <Button
                        onClick={reset}
                        className="rounded-full h-12 px-6"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Link
                        href="/"
                        className={cn(buttonStyles, glassVariant, "rounded-full h-12 px-6 gap-2")}
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
