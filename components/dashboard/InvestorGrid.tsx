"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Investor {
    id: string;
    name: string | null;
    email: string;
    role: string;
    profile: {
        bio: string | null;
        location: string | null;
        skills: string[];
    } | null;
    _count: {
        startups: number;
        followers: number;
    };
}

interface InvestorGridProps {
    initialInvestors: Investor[];
    searchQuery?: string;
    initialNextCursor?: string;
}

export function InvestorGrid({ initialInvestors, searchQuery, initialNextCursor }: InvestorGridProps) {
    const router = useRouter();
    const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
    const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
    const [loadingMore, setLoadingMore] = useState(false);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleLoadMore = async () => {
        if (!nextCursor) return;
        setLoadingMore(true);

        try {
            const res = await fetch(`/api/network?role=INVESTOR&limit=25&cursor=${nextCursor}`);
            if (res.ok) {
                const data = await res.json();
                // Handle both new cursor-based response and potential old array response for safety
                const newItems = Array.isArray(data) ? data : data.items;
                const newCursor = Array.isArray(data) ? undefined : data.nextCursor;

                setInvestors(prev => [...prev, ...newItems]);
                setNextCursor(newCursor);
            }
        } catch (error) {
            console.error("Failed to load more investors:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleMessage = async (investorId: string) => {
        setConnectingId(investorId);
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: investorId }),
            });

            if (res.ok) {
                const conversation = await res.json();
                startTransition(() => {
                    router.push(`/dashboard/messages?conversationId=${conversation.id}`);
                });
            }
        } catch (error) {
            console.error("Failed to start conversation:", error);
        } finally {
            setConnectingId(null);
        }
    };

    const filteredInvestors = searchQuery
        ? investors.filter(investor =>
            investor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            investor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            investor.profile?.location?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : investors;

    if (filteredInvestors.length === 0) {
        return (
            <GlassCard className="p-12 border-white/10 bg-black/40 text-center">
                <p className="text-zinc-400">No investors found</p>
                <p className="text-sm text-zinc-500 mt-2">Check back later or try a different search</p>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredInvestors.map((investor) => (
                    <GlassCard 
                        key={investor.id} 
                        className="group relative p-2 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-center text-center overflow-hidden min-h-[140px]"
                    >
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-sm font-black text-white mb-0.5 truncate px-1 tracking-tight">{investor.name?.split(' ')[0] || "Anon"}</h3>
                            <p className="text-[8px] text-zinc-600 truncate w-full uppercase font-bold mb-2">
                                {investor.profile?.location?.split(',')[0] || "Global"}
                            </p>

                            <div className="flex items-center justify-center gap-1 opacity-60">
                                <span className="text-[10px] font-black text-emerald-500">{investor._count.followers}</span>
                                <span className="text-[7px] text-zinc-500 uppercase font-black">Links</span>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-1.5 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/90">
                            <button
                                type="button"
                                onClick={() => handleMessage(investor.id)}
                                disabled={connectingId === investor.id || isPending}
                                className="w-full py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Link
                            </button>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {nextCursor && !searchQuery && (
                <div className="flex justify-center">
                    <Button
                        variant="glass"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 rounded-full flex items-center gap-2"
                    >
                        {loadingMore ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
