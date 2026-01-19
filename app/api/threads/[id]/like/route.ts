import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generalRateLimiter, checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/threads/[id]/like
 * Toggle like on a thread (with transaction to prevent race conditions)
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: threadId } = await params;

        // Rate limiting to prevent spam
        const clientIp = getClientIp(req);
        const rateLimitResult = await checkRateLimit(generalRateLimiter, `like:${clientIp}`);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many requests" },
                { status: 429 }
            );
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify thread exists
        const thread = await prisma.thread.findUnique({
            where: { id: threadId },
            select: { id: true },
        });

        if (!thread) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        // Use transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            const existingLike = await tx.threadLike.findUnique({
                where: {
                    threadId_userId: {
                        threadId,
                        userId: user.id,
                    },
                },
            });

            if (existingLike) {
                // Unlike
                await tx.threadLike.delete({
                    where: { id: existingLike.id },
                });
                return { liked: false };
            } else {
                // Like
                await tx.threadLike.create({
                    data: {
                        threadId,
                        userId: user.id,
                    },
                });
                return { liked: true };
            }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("THREAD_LIKE_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

