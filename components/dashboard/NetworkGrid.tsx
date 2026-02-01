"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    profile: {
        bio: string | null;
        location: string | null;
        skills: string[];
    } | null;
}

interface NetworkGridProps {
    initialUsers: User[];
    searchQuery?: string;
    initialHasMore: boolean;
}

export function NetworkGrid({ initialUsers, searchQuery, initialHasMore }: NetworkGridProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const nextPage = page + 1;

        try {
            const res = await fetch(`/api/network?role=DEVELOPER&page=${nextPage}&limit=25`);
            if (res.ok) {
                const data = await res.json();
                setUsers(prev => [...prev, ...data]);
                setHasMore(data.length === 25);
                setPage(nextPage);
            }
        } catch (error) {
            console.error("Failed to load more users:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    async function handleSendMessage(userId: string) {
        setSendingId(userId);
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (res.ok) {
                const conversation = await res.json();
                startTransition(() => {
                    router.push(`/dashboard/messages?conversationId=${conversation.id}`);
                });
            } else {
                console.error("Failed to create conversation");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSendingId(null);
        }
    }

    const filteredDevelopers = searchQuery
        ? users.filter(dev =>
            dev.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dev.profile?.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : users;

    if (filteredDevelopers.length === 0) {
        return (
            <GlassCard className="p-12 border-white/10 bg-black/40 text-center">
                <p className="text-zinc-400">No developers found</p>
                <p className="text-sm text-zinc-500 mt-2">Try a different search or check back later</p>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredDevelopers.map((developer) => {
                    const isCurrentUser = session?.user?.email === developer.email;

                    return (
                        <GlassCard 
                            key={developer.id} 
                            className="group relative p-2 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-center text-center overflow-hidden min-h-[140px]"
                        >
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                    <h3 className="text-sm font-black text-white truncate max-w-[110px] tracking-tight">{developer.name?.split(' ')[0] || "Anon"}</h3>
                                </div>

                                <div className="space-y-0.5 mb-1.5">
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter truncate px-2">
                                        {developer.profile?.location?.split(',')[0] || "Remote"}
                                    </p>
                                </div>

                                {developer.profile?.skills && developer.profile.skills.length > 0 && (
                                    <div className="flex justify-center">
                                        <span className="text-[8px] font-black uppercase text-indigo-400/60 px-1 border border-indigo-500/10 rounded bg-indigo-500/5 truncate max-w-[80px]">
                                            {developer.profile.skills[0]}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-1.5 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/90">
                                <button
                                    type="button"
                                    onClick={() => handleSendMessage(developer.id)}
                                    disabled={sendingId === developer.id || isPending || isCurrentUser}
                                    className="w-full py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Chat
                                </button>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {hasMore && !searchQuery && (
                <div className="flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
