import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/keys/[id] - Revoke an API key (soft delete)
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id: keyId } = await params;

        // Verify key belongs to user
        const apiKey = await prisma.apiKey.findUnique({
            where: { id: keyId },
        });

        if (!apiKey || apiKey.userId !== user.id) {
            return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }

        // Soft revoke - set isActive to false
        const updatedKey = await prisma.apiKey.update({
            where: { id: keyId },
            data: { isActive: false },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });

        return NextResponse.json({
            message: "API key revoked successfully",
            key: updatedKey,
        });
    } catch (error) {
        console.error("API_KEY_REVOKE_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * DELETE /api/keys/[id] - Permanently delete an API key
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id: keyId } = await params;

        // Verify key belongs to user
        const apiKey = await prisma.apiKey.findUnique({
            where: { id: keyId },
        });

        if (!apiKey || apiKey.userId !== user.id) {
            return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }

        await prisma.apiKey.delete({
            where: { id: keyId },
        });

        return NextResponse.json({ success: true, message: "API key deleted permanently" });
    } catch (error) {
        console.error("API_KEY_DELETE_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

