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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredInvestors.map((investor) => (
                    <GlassCard key={investor.id} className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center text-2xl">
                                👨‍💼
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-1">{investor.name || "Anonymous"}</h3>
                                <Badge variant="indigo" className="mb-2">
                                    Investor
                                </Badge>
                                <p className="text-sm text-zinc-400">{investor.profile?.location || "Location not specified"}</p>
                            </div>
                        </div>

                        {investor.profile?.bio && (
                            <p className="text-sm text-zinc-300 mb-4">{investor.profile.bio}</p>
                        )}

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                                <span className="text-sm text-zinc-400">Connections</span>
                                <span className="text-white font-semibold">{investor._count.followers}</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={() => handleMessage(investor.id)}
                            disabled={connectingId === investor.id || isPending}
                            className="w-full rounded-full flex items-center justify-center gap-2"
                        >
                            {connectingId === investor.id ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Starting Chat...
                                </>
                            ) : (
                                "Message"
                            )}
                        </Button>
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
