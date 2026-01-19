import { Suspense } from "react";
import { VerifyEmailContent } from "./VerifyEmailContent";
import { GlassCard } from "@/components/ui/GlassCard";
import { Mail } from "lucide-react";

function VerifyEmailLoading() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-md p-8 border-white/10 bg-black/60 text-center">
                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 w-fit mx-auto mb-4">
                    <Mail className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            </GlassCard>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailLoading />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
