import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

        // Fetch user's conversations
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                image: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        read: true,
                        senderId: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        // Format conversations with unread count
        const formattedConversations = conversations.map((conv) => {
            const otherParticipants = conv.participants.filter(p => p.userId !== user.id);
            const lastMessage = conv.messages[0] || null;

            return {
                id: conv.id,
                title: otherParticipants.map(p => p.user.name || p.user.email).join(", "),
                participants: otherParticipants.map(p => ({
                    id: p.user.id,
                    name: p.user.name,
                    email: p.user.email,
                    role: p.user.role,
                    avatar: p.user.image,
                })),
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isFromMe: lastMessage.senderId === user.id,
                } : null,
                updatedAt: conv.updatedAt,
            };
        });

        return NextResponse.json(formattedConversations);
    } catch (error) {
        console.error("CONVERSATIONS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
