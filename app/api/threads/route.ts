import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { sanitizeText } from "@/lib/sanitize";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

const MAX_THREADS_PER_PAGE = 50;

const createThreadSchema = z.object({
    title: z.string().min(5).max(200).trim(),
    content: z.string().min(10).max(5000).trim(),
    tags: z.array(z.string().max(30)).max(5).optional(),
});

/**
 * GET /api/threads
 * Get all threads with author info and reply count
 */
export async function GET(req: Request) {
    try {
        // Rate limiting
        const rateLimitCheck = await ensureRateLimit(req);
        if (rateLimitCheck) return rateLimitCheck;

        // Ensure user is authenticated
        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;

        const { searchParams } = new URL(req.url);
        const limit = Math.min(
            parseInt(searchParams.get("limit") || "20"),
            MAX_THREADS_PER_PAGE
        );
        const offset = parseInt(searchParams.get("offset") || "0");

        const threads = await prisma.thread.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profile: {
                            select: {
                                firm: true,
                                companyName: true,
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
                likes: {
                    select: { userId: true },
                },
                _count: {
                    select: { replies: true, likes: true },
                },
            },
        });

        // Get total count
        const total = await prisma.thread.count();

        return NextResponse.json({
            threads: threads.map(thread => ({
                id: thread.id,
                title: thread.title,
                content: thread.content,
                tags: thread.tags,
                author: {
                    id: thread.author.id,
                    name: thread.author.name,
                    role: thread.author.role,
                    company: thread.author.profile?.firm || thread.author.profile?.companyName,
                },
                replies: thread.replies.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    likes: reply.likes,
                    createdAt: reply.createdAt,
                    author: {
                        id: reply.author.id,
                        name: reply.author.name,
                        role: reply.author.role,
                    },
                })),
                likeCount: thread._count.likes,
                replyCount: thread._count.replies,
                likedByUser: thread.likes, // Will be filtered on frontend
                createdAt: thread.createdAt,
                updatedAt: thread.updatedAt,
            })),
            total,
            hasMore: offset + threads.length < total,
        });
    } catch (error) {
        console.error("THREADS_GET_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/threads
 * Create a new thread
 */
export async function POST(req: Request) {
    try {
        const rateLimitCheck = await ensureRateLimit(req);
        if (rateLimitCheck) return rateLimitCheck;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const validatedData = createThreadSchema.parse(body);

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create thread
        const thread = await prisma.thread.create({
            data: {
                authorId: user.id,
                title: sanitizeText(validatedData.title),
                content: sanitizeText(validatedData.content),
                tags: validatedData.tags?.map(t => sanitizeText(t)) || [],
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

        return NextResponse.json({ thread }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("THREADS_CREATE_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
