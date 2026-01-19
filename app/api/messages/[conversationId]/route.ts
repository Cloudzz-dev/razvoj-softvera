import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const { conversationId } = await params;

        // Parse pagination parameters from query string
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 messages per request
        const cursor = searchParams.get("cursor"); // Message ID to start from

        // Verify user is part of this conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: {
                        userId: user.id,
                    },
                },
            },
        });

        if (!conversation) {
            return new NextResponse("Conversation not found", { status: 404 });
        }

        // Fetch messages with cursor-based pagination
        // Cursor points to the last message ID from previous fetch
        // We fetch messages BEFORE this cursor (older messages)
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                ...(cursor ? { id: { lt: cursor } } : {}), // Get messages before cursor
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc", // Fetch newest first
            },
            take: limit + 1, // Fetch one extra to check if there are more
        });

        // Check if there are more messages
        const hasMore = messages.length > limit;
        const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

        // Reverse to chronological order (oldest first)
        const sortedMessages = paginatedMessages.reverse();

        // Get cursor for next page (oldest message ID in this batch)
        const nextCursor = hasMore && paginatedMessages.length > 0
            ? paginatedMessages[paginatedMessages.length - 1].id
            : null;

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: user.id },
                read: false,
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({
            messages: sortedMessages,
            pagination: {
                hasMore,
                nextCursor,
                limit,
            },
        });
    } catch (error) {
        console.error("MESSAGES_ERROR", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new NextResponse(errorMessage, { status: 500 });
    }
}
