import { useState, useEffect, useCallback, useRef } from "react";
import { pusherClient } from "@/lib/pusher";
import toast from "react-hot-toast";
import posthog from "posthog-js";

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    read?: boolean;
}

/**
 * Custom hook for managing conversation subscriptions and real-time updates
 * 
 * Handles:
 * - Fetching conversation messages
 * - Pusher subscription for real-time message delivery
 * - Typing indicator events
 * - Automatic cleanup on unmount
 * 
 * @param conversationId - The ID of the conversation to subscribe to
 * @param userId - The current user's ID
 * @returns Message state, loading state, typing indicator, and utility functions
 */
export function useConversationSubscription(
    conversationId: string | null | undefined,
    userId: string | null | undefined
) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [hasMore] = useState(false);
    const [nextCursor] = useState<string | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch messages from the server
    const fetchMessages = useCallback(async () => {
        if (!conversationId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/messages/${conversationId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to fetch messages");
            }

            const data = await response.json();

            // Transform data to match Message interface
            const formattedMessages = data.messages.map((msg: any) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.sender.name,
                content: msg.content,
                timestamp: msg.createdAt,
                read: msg.read,
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not load messages.";
            toast.error(`Error fetching messages: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    // Load more older messages
    const loadMoreMessages = useCallback(() => {
        if (hasMore && !isLoadingMore && nextCursor) {
            fetchMessages();
        }
    }, [hasMore, isLoadingMore, nextCursor, fetchMessages]);

    // Set up Pusher subscription for real-time updates
    useEffect(() => {
        if (!conversationId) return;

        const channelName = `private-${conversationId}`;
        const channel = pusherClient.subscribe(channelName);

        // Handle new messages
        channel.bind("new-message", (data: Message) => {
            setMessages((prev) => {
                // Avoid duplicates by checking message ID
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        });

        // Handle typing indicators
        channel.bind("client-typing", (data: { userId: string; typing: boolean }) => {
            if (data.userId !== userId) {
                setIsOtherUserTyping(data.typing);
            }
        });

        // Cleanup subscription on unmount or conversation change
        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [conversationId, userId]);

    // Set up Pusher error tracking
    useEffect(() => {
        const handleError = (error: any) => {
            posthog.capture("pusher_error", {
                error: error?.message || "Unknown Pusher error",
                conversationId,
            });
        };

        pusherClient.connection.bind("error", handleError);

        return () => {
            pusherClient.connection.unbind("error", handleError);
        };
    }, [conversationId]);

    // Fetch messages on mount or when conversationId changes
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Trigger typing event
    const triggerTyping = useCallback(() => {
        if (!conversationId || !userId) return;

        const channelName = `private-${conversationId}`;
        const channel = pusherClient.channel(channelName);
        if (!channel) return;

        // Trigger typing start
        channel.trigger("client-typing", { userId, typing: true });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to trigger typing stop after 5 seconds
        typingTimeoutRef.current = setTimeout(() => {
            channel.trigger("client-typing", { userId, typing: false });
        }, 5000);
    }, [conversationId, userId]);

    // Add a message optimistically (before server confirmation)
    const addOptimisticMessage = useCallback((message: Message) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    // Update a message (e.g., replace temporary ID with real ID)
    const updateMessage = useCallback((tempId: string, updatedMessage: Message) => {
        setMessages((prev) =>
            prev.map(msg => msg.id === tempId ? updatedMessage : msg)
        );
    }, []);

    // Remove a message (e.g., on failed send)
    const removeMessage = useCallback((messageId: string) => {
        setMessages((prev) => prev.filter(msg => msg.id !== messageId));
    }, []);

    return {
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
        refetchMessages: fetchMessages,
    };
}
