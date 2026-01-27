"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0B]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_50%)]" />
      <GlassCard className="max-w-md w-full text-center p-12 border-red-500/20 bg-red-500/5">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-zinc-400 mb-8">
          An unexpected error occurred. We have been notified and are working on a fix.
        </p>
        <Button
          onClick={reset}
          className="w-full bg-white text-black hover:bg-zinc-200 rounded-full py-6 font-semibold"
        >
          Try again
        </Button>
      </GlassCard>
    </div>
  );
}
