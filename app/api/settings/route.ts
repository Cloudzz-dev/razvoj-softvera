import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { z, ZodError } from "zod";
import { sanitizeText } from "@/lib/sanitize";

const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    bio: z.string().max(500).trim().optional(),
    location: z.string().max(100).trim().optional(),
    githubUrl: z.string().url().optional().or(z.literal("")),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    skills: z.array(z.string()).max(20).optional(),
});

/**
 * GET /api/settings
 * Fetch current user settings and profile
 */
export async function GET(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                profile: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                emailVerified: user.emailVerified,
            },
            profile: user.profile ? {
                bio: user.profile.bio,
                location: user.profile.location,
                skills: user.profile.skills,
                githubUrl: user.profile.githubUrl,
                linkedinUrl: user.profile.linkedinUrl,
                avatarUrl: user.profile.avatarUrl,
                experience: user.profile.experience,
                availability: user.profile.availability,
                rate: user.profile.rate,
                firm: user.profile.firm,
                checkSize: user.profile.checkSize,
                focus: user.profile.focus,
            } : null,
        });
    } catch (error) {
        console.error("SETTINGS_GET_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/settings
 * Update user settings and profile
 */
export async function PATCH(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const validatedData = updateProfileSchema.parse(body);

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update User name if provided
        if (validatedData.name) {
            await prisma.user.update({
                where: { id: user.id },
                data: { name: sanitizeText(validatedData.name) },
            });
        }

        // Build profile update data
        const profileData: any = {};
        if (validatedData.bio !== undefined) profileData.bio = sanitizeText(validatedData.bio);
        if (validatedData.location !== undefined) profileData.location = sanitizeText(validatedData.location);
        if (validatedData.githubUrl !== undefined) profileData.githubUrl = validatedData.githubUrl || null;
        if (validatedData.linkedinUrl !== undefined) profileData.linkedinUrl = validatedData.linkedinUrl || null;
        if (validatedData.skills !== undefined) profileData.skills = validatedData.skills;

        // Upsert profile
        if (Object.keys(profileData).length > 0) {
            await prisma.profile.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    ...profileData,
                },
                update: profileData,
            });
        }

        return NextResponse.json({ success: true, message: "Settings updated successfully" });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("SETTINGS_UPDATE_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/settings
 * Soft delete user account (30-day retention period)
 */
export async function DELETE(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, deletedAt: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already soft-deleted
        if (user.deletedAt) {
            return NextResponse.json(
                { error: "Account already scheduled for deletion" },
                { status: 400 }
            );
        }

        // Calculate deletion dates
        const deletedAt = new Date();
        const scheduledDeletionAt = new Date(deletedAt);
        scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30); // 30 days from now

        // Soft delete the user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                deletedAt,
                scheduledDeletionAt,
            },
        });

        console.log(`[SOFT_DELETE] User ${user.email} scheduled for deletion on ${scheduledDeletionAt.toISOString()}`);

        return NextResponse.json({
            success: true,
            message: "Account scheduled for deletion",
            scheduledDeletionAt: scheduledDeletionAt.toISOString(),
        });

    } catch (error) {
        console.error("ACCOUNT_DELETE_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
