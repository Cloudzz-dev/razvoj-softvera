import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

const MAX_CONVERSATIONS_PER_PAGE = 50;
const MAX_SEARCH_LENGTH = 100;

export async function GET(request: Request) {
    try {
        // Rate limiting
        const rateLimitCheck = await ensureRateLimit(request);
        if (rateLimitCheck) return rateLimitCheck;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        const { searchParams } = new URL(request.url);
        // Validate and limit search query length
        const rawSearchQuery = searchParams.get("searchQuery") || "";
        const searchQuery = rawSearchQuery.substring(0, MAX_SEARCH_LENGTH);

        // Pagination parameters
        const limit = Math.min(
            parseInt(searchParams.get("limit") || "20"),
            MAX_CONVERSATIONS_PER_PAGE
        );
        const offset = parseInt(searchParams.get("offset") || "0");

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: session.user.id },
                },
            },
            take: limit,
            skip: offset,
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                image: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                read: false,
                                senderId: { not: session.user.id },
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        const formattedConversations = conversations.map((conv) => {
            const lastMsg = conv.messages[0];
            const participants = conv.participants.map((p) => ({
                id: p.user.id,
                name: p.user.name,
                role: p.user.role,
                avatar: p.user.image || "👤",
            }));

            return {
                id: conv.id,
                participants,
                lastMessage: lastMsg?.content || "No messages yet",
                lastMessageTime: lastMsg ? getRelativeTime(lastMsg.createdAt) : "",
                unread: conv._count.messages,
            };
        });

        // Apply search filter if provided
        const filtered = searchQuery
            ? formattedConversations.filter(
                (conv) =>
                    conv.participants.some((p) =>
                        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    ) || conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : formattedConversations;

        return NextResponse.json({
            conversations: filtered,
            pagination: {
                limit,
                offset,
                hasMore: conversations.length === limit,
            },
        });
    } catch (error) {
        console.error("Conversation fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function getRelativeTime(date: Date) {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
}


export async function POST(req: Request) {
    try {
        const rateLimitCheck = await ensureRateLimit(req);
        if (rateLimitCheck) return rateLimitCheck;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: session.user.id } } },
                    { participants: { some: { userId } } },
                ],
            },
        });

        if (existingConversation) {
            return NextResponse.json(existingConversation);
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: session.user.id },
                        { userId },
                    ],
                },
            },
        });

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("CONVERSATION_CREATE_ERROR", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
