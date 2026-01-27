"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import posthog from "posthog-js";
import { useSession } from "next-auth/react";
import { useConversationSubscription, Message } from "@/hooks/useConversationSubscription";

import { PaymentRequiredModal } from "./PaymentRequiredModal";

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

    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        metadata: any;
        pendingMessage: string;
    }>({
        isOpen: false,
        metadata: null,
        pendingMessage: "",
    });

    const handleSend = async (paymentProof?: string) => {
        const messageToSend = paymentProof ? paymentModal.pendingMessage : newMessage;

        if (!messageToSend.trim() || !userId) return;

        const tempId = `temp_${Date.now()}`;

        // Only add optimistic message if it's not a retry (or if we want to show it again)
        // If it's a retry, the previous optimistic message might have failed or been removed.
        // For simplicity, let's re-add it.

        const sentMessage: Message = {
            id: tempId,
            senderId: userId,
            senderName: "You",
            content: messageToSend,
            timestamp: new Date().toISOString(),
        };

        if (!paymentProof) {
            addOptimisticMessage(sentMessage);
            setNewMessage("");
        }

        const otherParticipant = conversation?.participants[0];
        if (!otherParticipant) {
            toast.error("Cannot send message: no recipient found.");
            return;
        }

        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (paymentProof) {
                headers["x-payment-proof"] = paymentProof;
            }

            const response = await fetch(`/api/messages/send`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    receiverId: otherParticipant.id,
                    content: messageToSend
                }),
            });

            if (response.status === 402) {
                const errorData = await response.json();
                // Remove optimistic message since it failed (temporarily)
                removeMessage(tempId);

                // Open Payment Modal
                setPaymentModal({
                    isOpen: true,
                    metadata: errorData,
                    pendingMessage: messageToSend
                });
                return;
            }

            if (!response.ok) throw new Error("Failed to send message");

            const savedMessage = await response.json();

            // Track message sent
            posthog.capture("message_sent", {
                recipient_role: otherParticipant.role,
                is_new_conversation: !conversationId,
                message_length: messageToSend.length,
                paid: !!paymentProof
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

            if (paymentProof) {
                setPaymentModal(prev => ({ ...prev, isOpen: false }));
                setNewMessage("");
                toast.success("Payment successful! Message sent.");
            }

            if (!conversationId && savedMessage.conversationId) {
                window.location.href = `/dashboard/messages?conversationId=${savedMessage.conversationId}`;
            }
        } catch (error) {
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
        <>
            <GlassCard variant="medium" className="h-full flex flex-col rounded-3xl overflow-hidden border-white/10 shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="text-3xl w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 shadow-inner">
                                {otherParticipant.avatar}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-lg" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {otherParticipant.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="indigo" className="text-[10px] uppercase tracking-wider">
                                    {otherParticipant.role}
                                </Badge>
                                <span className="text-zinc-600 text-[10px]">•</span>
                                <span className="text-zinc-500 text-xs">Active now</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20 custom-scrollbar">
                    {hasMore && !isLoading && (
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={loadMoreMessages}
                                disabled={isLoadingMore}
                                className="px-4 py-2 text-xs font-medium rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all active:scale-95"
                            >
                                {isLoadingMore ? "Loading history..." : "Load Older Messages"}
                            </button>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-sm text-zinc-500">Decrypting messages...</p>
                        </div>
                    ) : (
                        messages.map((message, idx) => {
                            const isOwnMessage = message.senderId === userId;
                            const showAvatar = idx === 0 || messages[idx - 1].senderId !== message.senderId;
                            return (
                                <div key={message.id} className={`flex gap-4 ${isOwnMessage ? "flex-row-reverse" : "flex-row"} group`}>
                                    {showAvatar ? (
                                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-lg mt-1">
                                            {isOwnMessage ? "👤" : otherParticipant.avatar}
                                        </div>
                                    ) : (
                                        <div className="w-10 flex-shrink-0" />
                                    )}
                                    <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                                        {showAvatar && (
                                            <span className={`text-[10px] text-zinc-500 mb-1 px-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                                                {message.senderName} • {format(new Date(message.timestamp), "HH:mm")}
                                            </span>
                                        )}
                                        <div className={`px-5 py-3 rounded-3xl shadow-sm text-[15px] leading-relaxed transition-all ${isOwnMessage
                                            ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-900/20 hover:bg-indigo-500"
                                            : "bg-white/10 text-zinc-100 rounded-tl-none border border-white/5 hover:bg-white/15"
                                            }`}>
                                            <p>{message.content}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isOtherUserTyping && (
                        <div className="flex gap-4 flex-row items-end">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-lg">
                                {otherParticipant.avatar}
                            </div>
                            <div className="px-5 py-4 rounded-3xl rounded-tl-none bg-white/5 border border-white/10">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl z-20">
                    <div className="flex items-end gap-3 max-w-4xl mx-auto">
                        <button type="button" aria-label="Attach file" className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative group">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    triggerTyping();
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Type a message..."
                                aria-label="Message input"
                                rows={1}
                                className="w-full px-5 py-3.5 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-black/50 resize-none transition-all"
                            />
                            <div className="absolute right-3 bottom-3 text-[10px] text-zinc-600 font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">
                                ⏎ to send
                            </div>
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={!newMessage.trim()}
                            aria-label="Send message"
                            className="p-3.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </GlassCard>

            <PaymentRequiredModal
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                metadata={paymentModal.metadata}
                onSuccess={handleSend}
            />
        </>
    );
}
