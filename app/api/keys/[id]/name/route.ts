import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { sanitizeText } from "@/lib/sanitize";

const renameSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(50, "Name must be less than 50 characters")
        .trim(),
});

/**
 * PUT /api/keys/[id]/name - Rename an API key
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id: keyId } = await params;
        const body = await req.json();
        const validatedData = renameSchema.parse(body);

        // Verify key belongs to user
        const apiKey = await prisma.apiKey.findUnique({
            where: { id: keyId },
        });

        if (!apiKey || apiKey.userId !== user.id) {
            return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }

        // Update the name
        const updatedKey = await prisma.apiKey.update({
            where: { id: keyId },
            data: { name: sanitizeText(validatedData.name) },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
            },
        });

        return NextResponse.json({
            message: "API key renamed successfully",
            key: updatedKey,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("API_KEY_RENAME_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
