import { prisma } from "@/lib/prisma";

/**
 * Conversation Utilities
 * 
 * Shared logic for conversation management to avoid duplication
 * across API routes and reduce code complexity.
 */

export interface ConversationWithParticipants {
    id: string;
    participants: Array<{
        id: string;
        userId: string;
        conversationId: string;
        lastReadAt: Date | null;
        createdAt: Date;
    }>;
    messages?: any[];
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Get or create a conversation between two users
 * 
 * If a conversation already exists between the two users, it returns the existing one.
 * Otherwise, it creates a new conversation and returns it.
 * 
 * @param userId - The ID of the first user (typically the current user)
 * @param otherUserId - The ID of the second user
 * @returns The conversation with participants
 */
export async function getOrCreateConversation(
    userId: string,
    otherUserId: string
): Promise<ConversationWithParticipants> {
    // First, try to find an existing conversation between these two users
    let conversation = await prisma.conversation.findFirst({
        where: {
            AND: [
                {
                    participants: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                {
                    participants: {
                        some: {
                            userId: otherUserId,
                        },
                    },
                },
            ],
        },
        include: {
            participants: true,
        },
    });

    // If no conversation exists, create a new one
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: userId },
                        { userId: otherUserId },
                    ],
                },
            },
            include: {
                participants: true,
            },
        });
    }

    return conversation;
}

/**
 * Check if a user is a participant in a conversation
 * 
 * @param conversationId - The conversation ID to check
 * @param userId - The user ID to verify
 * @returns true if the user is a participant, false otherwise
 */
export async function isUserInConversation(
    conversationId: string,
    userId: string
): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId,
        },
    });

    return participant !== null;
}

/**
 * Update the last read timestamp for a user in a conversation
 * 
 * @param conversationId - The conversation ID
 * @param userId - The user ID
 */
export async function markConversationAsRead(
    conversationId: string,
    userId: string
): Promise<void> {
    await prisma.conversationParticipant.updateMany({
        where: {
            conversationId,
            userId,
        },
        data: {
            lastReadAt: new Date(),
        },
    });
}

/**
 * Get the other participant in a two-person conversation
 * 
 * @param conversation - The conversation object with participants
 * @param currentUserId - The current user's ID
 * @returns The other user's participant record, or null if not found
 */
export function getOtherParticipant(
    conversation: ConversationWithParticipants,
    currentUserId: string
) {
    return conversation.participants.find(p => p.userId !== currentUserId) || null;
}
