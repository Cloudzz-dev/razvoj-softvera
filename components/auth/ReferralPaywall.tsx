"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Copy, Check, Shield, Zap, Users, ArrowRight } from "lucide-react";

interface ReferralPaywallProps {
    currentReferrals: number;
    targetReferrals: number;
    referralCode?: string;
    onVerify?: () => void;
    onUpgrade?: () => void;
}

export function ReferralPaywall({
    currentReferrals,
    targetReferrals,
    referralCode = "Loading...",
    onVerify,
    onUpgrade
}: ReferralPaywallProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/register?ref=${referralCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassCard className="max-w-4xl w-full p-0 overflow-hidden border-orange-500/30 shadow-2xl shadow-orange-900/20">
                <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-6 border-b border-white/10 text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">Unlock the AI Matchmaker</h2>
                    <p className="text-zinc-400">Choose your path to enter the ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">

                    {/* PATH 1: HUSTLE (Verified Builder) */}
                    <div className="p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors group">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Verified Builder</h3>
                        <p className="text-zinc-400 text-sm mb-6 flex-1">
                            Link your GitHub/Portfolio and complete your bio. Prove you build.
                        </p>
                        <div className="text-2xl font-bold text-white mb-6">Free</div>
                        <button
                            onClick={onVerify}
                            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors mb-2"
                        >
                            Verify Profile
                        </button>
                        <p className="text-xs text-zinc-500">Manual review required</p>
                    </div>

                    {/* PATH 2: SOCIAL (Referrals) */}
                    <div className="p-6 flex flex-col items-center text-center bg-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-2 py-1">MOST POPULAR</div>
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Community</h3>
                        <p className="text-zinc-400 text-sm mb-6 flex-1">
                            Invite 3 fellow founders to join. Grow the network.
                        </p>
                        <div className="mb-6 w-full">
                            <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                <span>Progress</span>
                                <span>{currentReferrals}/{targetReferrals} Invites</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 transition-all duration-500"
                                    style={{ width: `${(currentReferrals / targetReferrals) * 100}%` }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="w-full py-2 px-4 rounded-lg border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Link Copied!" : "Copy Invite Link"}
                        </button>
                    </div>

                    {/* PATH 3: LAZY (Pro Subscription) */}
                    <div className="p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors group">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Pro Access</h3>
                        <p className="text-zinc-400 text-sm mb-6 flex-1">
                            Skip the line. Get instant access + priority matching.
                        </p>
                        <div className="text-2xl font-bold text-white mb-6">
                            $29<span className="text-sm text-zinc-500 font-normal">/mo</span>
                        </div>
                        <button
                            onClick={onUpgrade}
                            className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Upgrade Now <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-zinc-500">Cancel anytime</p>
                    </div>

                </div>
            </GlassCard>
        </div>
    );
}
