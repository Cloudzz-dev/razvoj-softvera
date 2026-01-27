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

    const isMobileView = selectedConversationId || receiverId;

    return (
        <div className="h-[calc(100dvh-100px)] md:h-[calc(100dvh-140px)] flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                 <h1 className="text-2xl md:text-3xl font-bold text-white">Messages</h1>
                 {/* Mobile Back Button */}
                 {isMobileView && (
                     <button 
                        onClick={() => setSelectedConversationId(undefined)}
                        className="lg:hidden text-sm text-zinc-400 hover:text-white flex items-center gap-2"
                     >
                        ← Back to Inbox
                     </button>
                 )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Inbox */}
                <div className={`lg:col-span-1 h-full min-h-0 ${isMobileView ? 'hidden lg:block' : 'block'}`}>
                    <MessageInbox
                        onSelectConversation={setSelectedConversationId}
                        selectedConversationId={selectedConversationId}
                        initialReceiverId={receiverId || undefined}
                    />
                </div>

                {/* Conversation */}
                <div className={`lg:col-span-2 h-full min-h-0 ${isMobileView ? 'block' : 'hidden lg:block'}`}>
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
