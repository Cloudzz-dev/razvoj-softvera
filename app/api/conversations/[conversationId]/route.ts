import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    props: { params: Promise<{ conversationId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { conversationId } = params;

    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
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
                    orderBy: { createdAt: "asc" },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Check if user is a participant
        const isParticipant = conversation.participants.some(
            (p) => p.userId === session.user.id
        );
        if (!isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formatted = {
            id: conversation.id,
            participants: conversation.participants.map((p) => ({
                id: p.user.id,
                name: p.user.name,
                role: p.user.role,
                avatar: p.user.image || "👤",
            })),
            messages: conversation.messages.map((m) => ({
                id: m.id,
                senderId: m.senderId,
                senderName: m.sender.name,
                content: m.content,
                timestamp: m.createdAt.toISOString(),
                read: m.read,
            })),
        };

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Conversation fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
