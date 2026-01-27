"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
        <GlassCard variant="medium" className="p-4 h-full rounded-3xl flex flex-col">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    Messages
                </h2>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        aria-label="Search conversations"
                        className="pl-10 py-6"
                    />
                </div>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-3">
                        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-xs font-medium">Loading inbox...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-sm bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        No conversations found.
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const otherParticipant = conv.participants[0] || { name: "Unknown", role: "User", avatar: "👤" };
                        const isSelected = selectedConversationId === conv.id;
                        const unreadCount = conv.unread || 0;

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`w-full text-left p-4 rounded-3xl transition-all duration-200 group ${isSelected
                                    ? "bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-900/20"
                                    : "bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10"
                                    } border`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`text-2xl flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 ${isSelected ? 'ring-2 ring-indigo-500/30' : ''}`}>
                                        {otherParticipant.avatar || "👤"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className={`font-semibold truncate flex items-center gap-2 ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                                                {otherParticipant.name || "Anonymous"}
                                                {otherParticipant.id === initialReceiverId && (
                                                    <Badge variant="indigo" className="text-xs uppercase tracking-wider font-bold">
                                                        You
                                                    </Badge>
                                                )}
                                            </p>
                                            {unreadCount > 0 && (
                                                <Badge variant="indigo" className="ml-2 px-2 py-0.5 shadow-lg shadow-indigo-500/40">
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Badge variant="outline" className="text-xs uppercase tracking-wide font-medium">
                                                {otherParticipant.role}
                                            </Badge>
                                            <span className="text-xs text-zinc-600">•</span>
                                            <span className="text-xs text-zinc-500">
                                                {conv.lastMessage?.createdAt
                                                    ? new Date(conv.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : "Just now"}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${unreadCount > 0 ? "text-zinc-100 font-medium" : "text-zinc-400 group-hover:text-zinc-300 transition-colors"}`}>
                                            {conv.lastMessage?.content || "No messages yet"}
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
