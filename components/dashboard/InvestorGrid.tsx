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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredInvestors.map((investor) => (
                    <GlassCard 
                        key={investor.id} 
                        className="group relative p-4 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-center text-center overflow-hidden min-h-[220px]"
                    >
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-white mb-1 truncate px-2">{investor.name || "Anonymous"}</h3>
                            <div className="flex flex-col items-center gap-1 mb-2">
                                <Badge variant="indigo" className="text-[10px] py-0">
                                    Investor
                                </Badge>
                                <p className="text-[11px] text-zinc-400 truncate w-full">{investor.profile?.location || "Unknown"}</p>
                            </div>

                            {investor.profile?.bio && (
                                <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2 italic">"{investor.profile.bio}"</p>
                            )}

                            <div className="flex items-center justify-center gap-2 py-1.5 border-y border-white/5 bg-white/5 rounded-xl">
                                <div className="text-center">
                                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Connections</p>
                                    <p className="text-sm font-bold text-white">{investor._count.followers}</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black via-black/90 to-transparent">
                            <button
                                type="button"
                                onClick={() => handleMessage(investor.id)}
                                disabled={connectingId === investor.id || isPending}
                                className="w-full px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {connectingId === investor.id ? "..." : "Message"}
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
