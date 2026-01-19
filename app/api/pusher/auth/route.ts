import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

        const body = await req.formData();
        const socketId = body.get("socket_id") as string;
        const channel = body.get("channel_name") as string;

        // Verify user is part of the conversation (channel name is private-CONVERSATION_ID)
        if (channel.startsWith("private-")) {
            const conversationId = channel.replace("private-", "");
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
                return new NextResponse("Unauthorized to access this channel", { status: 403 });
            }
        }

        const authResponse = pusherServer.authorizeChannel(socketId, channel);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error("PUSHER_AUTH_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
