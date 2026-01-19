import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { sanitizeText } from "@/lib/sanitize";

const replySchema = z.object({
    content: z.string().min(1).max(2000).trim(),
});

/**
 * POST /api/threads/[id]/replies
 * Add a reply to a thread
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: threadId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = replySchema.parse(body);

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check thread exists
        const thread = await prisma.thread.findUnique({
            where: { id: threadId },
            select: { id: true, authorId: true },
        });

        if (!thread) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        // Create reply
        const reply = await prisma.threadReply.create({
            data: {
                threadId,
                authorId: user.id,
                content: sanitizeText(validatedData.content),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        // Create notification for thread author (if not replying to own thread)
        if (thread.authorId !== user.id) {
            await prisma.notification.create({
                data: {
                    userId: thread.authorId,
                    type: "thread_reply",
                    title: "New reply to your thread",
                    message: `${user.name || "Someone"} replied to your thread`,
                    link: `/dashboard/threads?id=${threadId}`,
                },
            });
        }

        return NextResponse.json({ reply }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("REPLY_CREATE_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
