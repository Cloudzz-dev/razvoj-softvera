"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Check, CheckCheck } from "lucide-react";
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
                read: savedMessage.read // Ensure read status is passed
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
        <>
            <GlassCard variant="medium" className="h-full flex flex-col rounded-[2rem] overflow-hidden border-white/10 shadow-2xl bg-black/40">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-zinc-800 border border-white/10 shadow-xl overflow-hidden">
                                {renderAvatar(otherParticipant.avatar, otherParticipant.name)}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-black rounded-full shadow-lg" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                                {otherParticipant.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] md:text-xs uppercase tracking-wider font-bold opacity-60">
                                    {otherParticipant.role}
                                </Badge>
                                <span className="text-zinc-600 text-xs">•</span>
                                <span className="text-emerald-500 text-xs font-medium">Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-1 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black custom-scrollbar relative">
                    <div className="absolute inset-0 bg-grid-small-white/[0.02] pointer-events-none" />
                    
                    {hasMore && !isLoading && (
                        <div className="flex justify-center mb-8 relative z-10">
                            <button
                                onClick={loadMoreMessages}
                                disabled={isLoadingMore}
                                className="px-6 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white border border-white/5 transition-all"
                            >
                                {isLoadingMore ? "Decrypting history..." : "Load Older Messages"}
                            </button>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50 relative z-10">
                            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Secure Link Establishing...</p>
                        </div>
                    ) : (
                        messages.map((message, idx) => {
                            const isOwnMessage = message.senderId === userId;
                            const prevMessage = messages[idx - 1];
                            const isSameSender = prevMessage && prevMessage.senderId === message.senderId;
                            const showAvatar = !isSameSender || !prevMessage;
                            
                            const marginTop = isSameSender ? "mt-1" : "mt-6";

                            return (
                                <div key={message.id} className={`relative z-10 flex w-full ${marginTop} ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex max-w-[85%] md:max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-end gap-3`}>
                                        
                                        {!isOwnMessage && (
                                            <div className={`w-8 h-8 flex-shrink-0 flex items-end ${showAvatar ? "opacity-100" : "opacity-0 translate-y-2"}`}>
                                                 {showAvatar && (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shadow-lg">
                                                        {renderAvatar(otherParticipant.avatar, otherParticipant.name)}
                                                    </div>
                                                 )}
                                            </div>
                                        )}

                                        <div 
                                            className={`
                                                relative px-5 py-3 shadow-2xl text-[14px] leading-relaxed
                                                ${isOwnMessage 
                                                    ? "bg-emerald-600 text-white rounded-[1.25rem] rounded-tr-none shadow-emerald-900/20" 
                                                    : "bg-zinc-900/80 backdrop-blur-md text-zinc-100 rounded-[1.25rem] rounded-tl-none border border-white/10"
                                                }
                                            `}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                            
                                            <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] font-bold uppercase tracking-tighter ${isOwnMessage ? "text-emerald-100/60 justify-end" : "text-zinc-500 justify-start"}`}>
                                                <span>{format(new Date(message.timestamp), "HH:mm")}</span>
                                                {isOwnMessage && (
                                                    <span className="flex items-center">
                                                        {message.read ? (
                                                            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                                                        ) : (
                                                            <Check className="w-3.5 h-3.5 text-emerald-400/50" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isOtherUserTyping && (
                        <div className="flex gap-3 flex-row items-end mt-6 relative z-10">
                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                                {renderAvatar(otherParticipant.avatar, otherParticipant.name)}
                            </div>
                            <div className="px-5 py-3 rounded-2xl rounded-tl-none bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
<<<<<<< HEAD
                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-black/40 backdrop-blur-xl z-20 shrink-0">
                    <div className="flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                        <button type="button" aria-label="Attach file" className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0">
=======
                <div className="p-4 md:p-6 border-t border-white/5 bg-zinc-900/60 backdrop-blur-2xl z-20 shrink-0">
                    <div className="flex items-end gap-3 max-w-5xl mx-auto">
                        <button type="button" aria-label="Attach" className="p-3 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all active:scale-95">
>>>>>>> test
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative group min-w-0">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    triggerTyping();
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Write a secure message..."
                                aria-label="Message input"
                                rows={1}
<<<<<<< HEAD
                                className="w-full px-5 py-3 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all text-base min-h-[46px] max-h-[120px]"
=======
                                className="w-full px-6 py-3.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none transition-all min-h-[52px] max-h-[160px]"
>>>>>>> test
                            />
                            <div className="absolute right-3 bottom-3 text-[10px] text-zinc-600 font-mono opacity-0 group-focus-within:opacity-100 transition-opacity hidden md:block">
                                ⏎ to send
                            </div>
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={!newMessage.trim()}
<<<<<<< HEAD
                            aria-label="Send message"
                            className="p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
=======
                            aria-label="Send"
                            className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-[52px] h-[52px]"
>>>>>>> test
                        >
                            <Send className="w-5 h-5 ml-0.5" />
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