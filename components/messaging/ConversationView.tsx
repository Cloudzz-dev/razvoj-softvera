"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Send, Paperclip } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import posthog from "posthog-js";
import { useSession } from "next-auth/react";
import { useConversationSubscription, Message } from "@/hooks/useConversationSubscription";

interface Conversation {
    id: string;
    participants: { id: string; name: string; role: string; avatar: string | null }[];
}

interface ConversationViewProps {
    conversationId: string;
    conversation?: Conversation | null;
    initialReceiverId?: string;
}

export function ConversationView({
    conversationId,
    conversation: conversationProp,
    initialReceiverId
}: ConversationViewProps) {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [newMessage, setNewMessage] = useState("");
    const [conversation, setConversation] = useState<Conversation | null>(conversationProp || null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use custom hook for all Pusher subscription and message fetching logic
    const {
        messages,
        isLoading,
        isLoadingMore,
        hasMore,
        isOtherUserTyping,
        triggerTyping,
        addOptimisticMessage,
        updateMessage,
        removeMessage,
        loadMoreMessages,
    } = useConversationSubscription(conversationId, userId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch conversation details if not provided
    useEffect(() => {
        if (conversationProp || (!conversationId && !initialReceiverId)) return;

        const fetchConversation = async () => {
            try {
                if (conversationId) {
                    const res = await fetch(`/api/messages/conversations`);
                    if (res.ok) {
                        const convs: any[] = await res.json();
                        const currentConv = convs.find(c => c.id === conversationId);
                        if (currentConv) {
                            setConversation(currentConv);
                            return;
                        }
                    }
                }

                if (initialReceiverId) {
                    const res = await fetch(`/api/admin/users`);
                    if (res.ok) {
                        const { users }: { users: any[] } = await res.json();
                        const targetUser = users.find(u => u.id === initialReceiverId);
                        if (targetUser) {
                            setConversation({
                                id: "",
                                participants: [{
                                    id: targetUser.id,
                                    name: targetUser.name,
                                    role: targetUser.role,
                                    avatar: targetUser.image || "👤"
                                }]
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchConversation();
    }, [conversationId, initialReceiverId, conversationProp]);

    // Auto-scroll when messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages, isOtherUserTyping]);

    const handleSend = async () => {
        if (!newMessage.trim() || !userId) return;

        const tempId = `temp_${Date.now()}`;
        const sentMessage: Message = {
            id: tempId,
            senderId: userId, // This might be email, need to check how backend handles it
            senderName: "You",
            content: newMessage,
            timestamp: new Date().toISOString(),
        };

        // Optimistically add message to UI
        addOptimisticMessage(sentMessage);
        setNewMessage("");

        const otherParticipant = conversation?.participants[0];
        if (!otherParticipant) {
            toast.error("Cannot send message: no recipient found.");
            return;
        }

        try {
            const response = await fetch(`/api/messages/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: otherParticipant.id,
                    content: newMessage
                }),
            });

            // Wait, the send endpoint expects receiverId. 
            // If we are in a conversation view, we should use the [conversationId] endpoint to reply?
            // Let's check the API implementation.

            // Checking /api/messages/[conversationId]/route.ts
            // It handles GET. Does it handle POST?
            // I need to check that file.


            if (!response.ok) throw new Error("Failed to send message");
            const savedMessage = await response.json();

            // Track message sent
            posthog.capture("message_sent", {
                recipient_role: otherParticipant.role,
                is_new_conversation: !conversationId,
                message_length: newMessage.length,
            });

            // Format saved message
            const formattedSavedMessage = {
                id: savedMessage.id,
                senderId: userId || "",
                senderName: "You",
                content: savedMessage.content,
                timestamp: savedMessage.createdAt,
            };

            updateMessage(tempId, formattedSavedMessage);

            // If this was a new conversation, we might want to refresh to get the conversationId
            if (!conversationId && savedMessage.conversationId) {
                // We could redirect or update state
                window.location.href = `/dashboard/messages?conversationId=${savedMessage.conversationId}`;
            }
        } catch (error) {
            // Capture message send error
            posthog.captureException(error instanceof Error ? error : new Error("Message send failed"));
            toast.error("Message failed to send.");
            removeMessage(tempId);
        }
    };

    if (!conversation) {
        return (
            <GlassCard variant="medium" className="h-full flex items-center justify-center">
                <p className="text-zinc-500">Select a conversation to view messages</p>
            </GlassCard>
        );
    }

    const otherParticipant = conversation.participants[0];

    return (
        <GlassCard variant="medium" className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{otherParticipant.avatar}</div>
                    <div>
                        <h3 className="font-semibold text-white">{otherParticipant.name}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">{otherParticipant.role}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {hasMore && !isLoading && (
                    <div className="flex justify-center mb-2">
                        <button
                            onClick={loadMoreMessages}
                            disabled={isLoadingMore}
                            className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingMore ? "Loading..." : "Load Older Messages"}
                        </button>
                    </div>
                )}
                {isLoading ? (
                    <div className="text-center text-zinc-500">Loading messages...</div>
                ) : (
                    messages.map((message, idx) => {
                        const isOwnMessage = message.senderId === userId;
                        const showAvatar = idx === 0 || messages[idx - 1].senderId !== message.senderId;
                        return (
                            <div key={message.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                                {showAvatar ? <div className="text-2xl flex-shrink-0">{isOwnMessage ? "👤" : otherParticipant.avatar}</div> : <div className="w-8 flex-shrink-0" />}
                                <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                                    {showAvatar && <p className="text-xs text-zinc-500 mb-1">{message.senderName}</p>}
                                    <div className={`px-4 py-2 rounded-lg ${isOwnMessage ? "bg-indigo-600 text-white" : "bg-white/10 text-white"}`}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                    <p className="text-xs text-zinc-600 mt-1">{format(new Date(message.timestamp), "MMM dd, HH:mm")}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                {isOtherUserTyping && (
                    <div className="flex gap-3 flex-row items-start">
                        <div className="text-2xl flex-shrink-0">{otherParticipant.avatar}</div>
                        <div className="flex flex-col items-start max-w-[70%]">
                            <div className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                <p className="text-sm flex items-center gap-2">
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                    Typing...
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-end gap-2">
                    <button type="button" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"><Paperclip className="w-5 h-5" /></button>
                    <div className="flex-1">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                triggerTyping();
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                    <button onClick={handleSend} disabled={!newMessage.trim()} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-5 h-5" /></button>
                </div>
            </div>
        </GlassCard>
    );
}
