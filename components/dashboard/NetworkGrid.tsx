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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDevelopers.map((developer) => {
                    const isCurrentUser = session?.user?.email === developer.email;

                    return (
                        <GlassCard 
                            key={developer.id} 
                            className="group relative aspect-square p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-center text-center overflow-hidden"
                        >
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-white">{developer.name || "Anonymous"}</h3>
                                    {isCurrentUser && (
                                        <Badge variant="indigo">
                                            You
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-2 mb-4">
                                    <Badge variant="indigo">
                                        Developer
                                    </Badge>
                                    <Badge variant="green" dot>
                                        Available
                                    </Badge>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                                        <MapPin className="w-4 h-4" />
                                        <span>{developer.profile?.location || "Location not specified"}</span>
                                    </div>
                                </div>

                                {developer.profile?.skills && developer.profile.skills.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {developer.profile.skills.slice(0, 3).map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant="outline"
                                                className="text-[10px] opacity-60"
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <button
                                    type="button"
                                    onClick={() => handleSendMessage(developer.id)}
                                    disabled={sendingId === developer.id || isPending || isCurrentUser}
                                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCurrentUser ? "It's You" : sendingId === developer.id ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Opening...
                                        </>
                                    ) : (
                                        "Message"
                                    )}
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
