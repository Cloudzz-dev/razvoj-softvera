"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Terminal } from "lucide-react";
import { useSession } from "next-auth/react";

export function DemoControls() {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        // Show if specifically enabled, in dev, OR if current user is the demo account
        const isDemoUser = session?.user?.email === "demo@cloudzz.dev";
        if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "development" || isDemoUser) {
            setIsVisible(true);
        }
    }, [session]);

    const handleReset = async () => {
        if (!confirm("Reset demo data? This will clear recent messages and notifications.")) return;

        setIsResetting(true);
        try {
            const res = await fetch("/api/admin/reset-demo", { method: "POST" });
            if (res.ok) {
                window.location.reload();
            } else {
                alert("Failed to reset");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsResetting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 text-xs text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                <Terminal className="w-3 h-3 text-green-400" />
                <Badge variant="outline" className="text-[10px] font-mono opacity-80 border-none px-0">
                    DEMO MODE
                </Badge>
                <div className="h-3 w-[1px] bg-white/20 mx-1" />
                <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="hover:text-white text-zinc-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                    {isResetting ? 'Resetting...' : 'Reset Data'}
                </button>
            </div>
        </div>
    );
}
