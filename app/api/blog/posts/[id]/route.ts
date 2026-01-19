import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface Props {
    params: Promise<{ id: string }>;
}

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

const updatePostSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().optional(),
    coverImage: z.string().url().optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

/**
 * GET /api/blog/posts/[id] - Get single post
 */
export async function GET(req: Request, { params }: Props) {
    try {
        const { id } = await params;

        const post = await prisma.blogPost.findUnique({
            where: { id },
            include: { author: { select: { name: true } } },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error("GET_POST_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * PATCH /api/blog/posts/[id] - Update post (admin only)
 */
export async function PATCH(req: Request, { params }: Props) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await validateAdmin(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = updatePostSchema.parse(body);

        // Check post exists
        const existingPost = await prisma.blogPost.findUnique({
            where: { id },
        });

        if (!existingPost) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Update the post
        const updateData: any = { ...validatedData };

        // Set publishedAt when publishing
        if (validatedData.status === "PUBLISHED" && existingPost.status !== "PUBLISHED") {
            updateData.publishedAt = new Date();
        }

        const post = await prisma.blogPost.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("UPDATE_POST_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/blog/posts/[id] - Delete post (admin only)
 */
export async function DELETE(req: Request, { params }: Props) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await validateAdmin(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.blogPost.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_POST_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
