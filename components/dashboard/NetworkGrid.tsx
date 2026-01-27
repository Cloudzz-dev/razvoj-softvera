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
                        <GlassCard key={developer.id} className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-indigo-600/20 flex items-center justify-center text-2xl">
                                    👨‍💻
                                </div>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white">{developer.name || "Anonymous"}</h3>
                                    {isCurrentUser && (
                                        <Badge variant="indigo">
                                            You
                                        </Badge>
                                    )}
                                </div>
                                <Badge variant="indigo" className="mb-2">
                                    Developer
                                </Badge>
                                <div className="mb-2">
                                    <Badge variant="green" dot>
                                        Available
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>{developer.profile?.location || "Location not specified"}</span>
                                </div>
                            </div>

                            {developer.profile?.skills && developer.profile.skills.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs text-zinc-500 mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {developer.profile.skills.slice(0, 4).map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant={searchQuery && skill.toLowerCase().includes(searchQuery.toLowerCase()) ? "indigo" : "outline"}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => handleSendMessage(developer.id)}
                                disabled={sendingId === developer.id || isPending || isCurrentUser}
                                className="w-full px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCurrentUser ? "It's You" : sendingId === developer.id ? "Opening..." : "Send Message"}
                            </button>
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
