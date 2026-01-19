"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Search, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

interface Conversation {
    id: string;
    participants: { id: string; name: string; role: string; avatar: string | null }[];
    lastMessage: {
        content: string;
        createdAt: string;
        isFromMe: boolean;
    } | null;
    updatedAt: string;
    unread?: number;
}

interface MessageInboxProps {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string;
    initialReceiverId?: string;
}

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function MessageInbox({ onSelectConversation, selectedConversationId, initialReceiverId }: MessageInboxProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = useCallback(async (query: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/messages/conversations?searchQuery=${query}`);
            if (!response.ok) throw new Error("Failed to fetch conversations");
            const data: Conversation[] = await response.json();
            setConversations(data);
            return data;
        } catch (error) {
            console.error(error);
            toast.error("Could not load conversations.");
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchAndSelect = async () => {
            const data = await fetchConversations(debouncedSearchQuery);
            if (initialReceiverId && !selectedConversationId && data.length > 0) {
                // If we have an initialReceiverId, see if it exists in conversations
                const existingConv = data.find(c =>
                    c.participants.some(p => p.id === initialReceiverId)
                );
                if (existingConv) {
                    onSelectConversation(existingConv.id);
                }
            }
        };
        fetchAndSelect();
    }, [debouncedSearchQuery, fetchConversations, initialReceiverId, onSelectConversation, selectedConversationId]);

    return (
        <GlassCard variant="medium" className="p-4 h-full">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                {isLoading ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">No conversations found.</div>
                ) : (
                    conversations.map((conv) => {
                        const otherParticipant = conv.participants[0] || { name: "Unknown", role: "User", avatar: "👤" };
                        const isSelected = selectedConversationId === conv.id;
                        const unreadCount = conv.unread || 0;

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`w-full text-left p-3 rounded-lg transition-all ${isSelected ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 hover:bg-white/10"} border border-transparent`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0">{otherParticipant.avatar || "👤"}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-white truncate flex items-center gap-2">
                                                {otherParticipant.name || "Anonymous"}
                                                {otherParticipant.id === initialReceiverId && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                                        You
                                                    </span>
                                                )}
                                            </p>
                                            {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">{unreadCount}</span>}
                                        </div>
                                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">{otherParticipant.role}</p>
                                        <p className={`text-sm truncate ${unreadCount > 0 ? "text-white font-medium" : "text-zinc-400"}`}>
                                            {conv.lastMessage?.content || "No messages yet"}
                                        </p>
                                        <p className="text-xs text-zinc-600 mt-1">
                                            {conv.lastMessage?.createdAt
                                                ? new Date(conv.lastMessage.createdAt).toLocaleDateString()
                                                : "Just now"}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </GlassCard>
    );
}
