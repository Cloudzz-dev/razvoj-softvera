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

    const renderAvatar = (avatar: string | null, name: string) => {
        if (avatar && avatar.startsWith("http")) {
            return (
                <img 
                    src={avatar} 
                    alt={name} 
                    className="w-full h-full rounded-full object-cover"
                />
            );
        }
        return <span className="text-xl">{avatar || "👤"}</span>;
    };

    return (
        <GlassCard variant="medium" className="p-4 h-full rounded-[2rem] flex flex-col bg-black/40 border-white/10">
            <div className="mb-6 px-2">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 tracking-tighter">
                    <MessageSquare className="w-6 h-6 text-emerald-500" />
                    INBOX
                </h2>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search encrypts..."
                        aria-label="Search conversations"
                        className="pl-12 py-7 bg-white/5 border-white/5 focus:border-emerald-500/50 rounded-2xl transition-all"
                    />
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar px-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-3">
                        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Scanning Network...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-sm bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                        <MessageSquare className="w-10 h-10 mx-auto mb-4 opacity-10" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">No active links</p>
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
                                className={`w-full text-left p-5 rounded-[1.5rem] transition-all duration-300 group relative overflow-hidden ${isSelected
                                    ? "bg-emerald-600/10 border-emerald-500/30 shadow-2xl shadow-emerald-900/20"
                                    : "bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10"
                                    } border`}
                            >
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                )}
                                <div className="flex items-center gap-4">
                                    <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-zinc-800 border border-white/10 overflow-hidden shadow-lg transition-transform group-hover:scale-105 ${isSelected ? 'ring-2 ring-emerald-500/50' : ''}`}>
                                        {renderAvatar(otherParticipant.avatar, otherParticipant.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`font-bold truncate text-base tracking-tight ${isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                                                {otherParticipant.name || "Anonymous"}
                                            </p>
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase">
                                                {conv.lastMessage?.createdAt
                                                    ? new Date(conv.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : "Now"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black opacity-50 border-white/20">
                                                {otherParticipant.role}
                                            </Badge>
                                            {unreadCount > 0 && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${unreadCount > 0 ? "text-zinc-100 font-bold" : "text-zinc-500 group-hover:text-zinc-400 transition-colors"}`}>
                                            {conv.lastMessage?.content || "No secure data transferred"}
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
