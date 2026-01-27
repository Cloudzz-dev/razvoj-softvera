"use client";

import { useState } from "react";
import { MessageInbox } from "@/components/messaging/MessageInbox";
import { ConversationView } from "@/components/messaging/ConversationView";

import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function MessagesContent() {
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("conversationId");
    const receiverId = searchParams.get("receiverId");
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(conversationId || undefined);

    return (
        <div className="h-[calc(100dvh-120px)]">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Messages</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100%-52px)] md:h-[calc(100%-60px)]">
                {/* Inbox */}
                <div className="lg:col-span-1">
                    <MessageInbox
                        onSelectConversation={setSelectedConversationId}
                        selectedConversationId={selectedConversationId}
                        initialReceiverId={receiverId || undefined}
                    />
                </div>

                {/* Conversation */}
                <div className="lg:col-span-2">
                    {selectedConversationId ? (
                        <ConversationView conversationId={selectedConversationId} />
                    ) : receiverId ? (
                        <ConversationView conversationId="" initialReceiverId={receiverId} />
                    ) : (
                        <div className="h-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center">
                            <p className="text-zinc-500">Select a conversation to view messages</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="text-white">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
