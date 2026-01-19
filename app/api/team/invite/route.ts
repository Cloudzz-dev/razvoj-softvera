import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import crypto from "crypto";
import { sendTeamInviteEmail } from "@/lib/email";

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
});

/**
 * POST /api/team/invite
 * Invite someone to the team
 */
export async function POST(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const validatedData = inviteSchema.parse(body);

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get user's startup and team
        const startup = await prisma.startup.findFirst({
            where: { founderId: user.id },
            include: { team: true },
        });

        if (!startup || !startup.team) {
            return NextResponse.json({ error: "You don't have a team" }, { status: 400 });
        }

        // Check if already a member
        const existingMember = await prisma.teamMembership.findFirst({
            where: {
                teamId: startup.team.id,
                user: { email: validatedData.email },
            },
        });

        if (existingMember) {
            return NextResponse.json({ error: "User is already a team member" }, { status: 400 });
        }

        // Check if invite already pending
        const existingInvite = await prisma.teamInvite.findFirst({
            where: {
                teamId: startup.team.id,
                email: validatedData.email,
                status: "PENDING",
            },
        });

        if (existingInvite) {
            return NextResponse.json({ error: "Invite already sent to this email" }, { status: 400 });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invite
        const invite = await prisma.teamInvite.create({
            data: {
                teamId: startup.team.id,
                email: validatedData.email.toLowerCase(),
                role: validatedData.role as "ADMIN" | "MEMBER" | "VIEWER",
                token,
                expiresAt,
            },
        });

        // Check if user exists on platform
        const invitedUser = await prisma.user.findUnique({
            where: { email: validatedData.email.toLowerCase() },
        });

        if (invitedUser) {
            // Send in-app notification
            await prisma.notification.create({
                data: {
                    userId: invitedUser.id,
                    type: "team_invite",
                    title: "Team Invitation",
                    message: `${user.name || "Someone"} invited you to join ${startup.name}`,
                    link: `/api/team/invite/${token}`,
                },
            });
        }

        // Send email invite
        try {
            await sendTeamInviteEmail({
                to: validatedData.email,
                inviterName: user.name || "A team member",
                startupName: startup.name,
                token,
            });
        } catch (emailError) {
            console.error("Failed to send invite email:", emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            invite: {
                id: invite.id,
                email: invite.email,
                role: invite.role,
                expiresAt: invite.expiresAt,
            },
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("TEAM_INVITE_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
