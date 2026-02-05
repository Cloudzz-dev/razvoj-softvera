"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInvestors.map((investor) => (
                    <GlassCard
                        key={investor.id}
                        className="group relative p-6 border-white/5 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-between text-center overflow-hidden min-h-[180px]"
                    >
                        <div className="flex-1 flex flex-col justify-center items-center space-y-3">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-white truncate max-w-[200px] tracking-tight">{investor.name || "User"}</h3>
                                <div className="flex items-center justify-center gap-2 text-zinc-400">
                                    <MapPin size={14} />
                                    <p className="text-sm font-medium">
                                        {investor.profile?.location || "Global"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <span className="text-sm font-bold text-emerald-500">{investor._count.followers}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Followers</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/90 flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => handleMessage(investor.id)}
                                disabled={connectingId === investor.id || isPending}
                                className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest transition-all transform hover:scale-105"
                            >
                                Connect
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
