import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { z, ZodError } from "zod";
import { sanitizeText } from "@/lib/sanitize";

// Validation schema for creating blog posts
const createPostSchema = z.object({
    title: z.string().min(1, "Title is required").max(200).trim(),
    slug: z.string().min(1, "Slug is required").max(200).trim()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
    excerpt: z.string().max(500).optional(),
    content: z.string().optional(),
    coverImage: z.string().url().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
});

/**
 * Validates that the user is an ADMIN
 */
async function validateAdmin(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
        return null;
    }

    return user;
}

/**
 * GET /api/blog/posts - List all posts (admin only)
 */
export async function GET(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = await validateAdmin(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
        }

        const posts = await prisma.blogPost.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                author: { select: { name: true } },
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("GET_POSTS_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/blog/posts - Create new post (admin only)
 */
export async function POST(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = await validateAdmin(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
        }

        const body = await req.json();
        const validatedData = createPostSchema.parse(body);

        // Check for existing slug
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug: validatedData.slug },
        });

        if (existingPost) {
            return NextResponse.json(
                { error: "A post with this slug already exists" },
                { status: 409 }
            );
        }

        // Create the post
        const post = await prisma.blogPost.create({
            data: {
                title: sanitizeText(validatedData.title),
                slug: validatedData.slug,
                excerpt: validatedData.excerpt ? sanitizeText(validatedData.excerpt) : null,
                content: validatedData.content ? sanitizeText(validatedData.content) : null,
                coverImage: validatedData.coverImage || null,
                status: validatedData.status,
                authorId: user.id,
                publishedAt: validatedData.status === "PUBLISHED" ? new Date() : null,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("CREATE_POST_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
