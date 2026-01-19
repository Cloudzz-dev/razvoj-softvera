import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/team/invite/[token]
 * View invite details
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const invite = await prisma.teamInvite.findUnique({
            where: { token },
            include: {
                team: {
                    include: {
                        startup: {
                            select: { name: true, pitch: true, logo: true },
                        },
                    },
                },
            },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ error: "Invite already used" }, { status: 400 });
        }

        if (new Date() > invite.expiresAt) {
            await prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "EXPIRED" },
            });
            return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
        }

        return NextResponse.json({
            invite: {
                email: invite.email,
                role: invite.role,
                startup: invite.team.startup,
            },
        });
    } catch (error) {
        console.error("INVITE_GET_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/team/invite/[token]
 * Accept invite
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized - please log in first" }, { status: 401 });
        }

        const invite = await prisma.teamInvite.findUnique({
            where: { token },
            include: {
                team: {
                    include: {
                        startup: { select: { name: true, founderId: true } },
                    },
                },
            },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ error: "Invite already used" }, { status: 400 });
        }

        if (new Date() > invite.expiresAt) {
            await prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "EXPIRED" },
            });
            return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
        }

        // Verify email matches
        if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
            return NextResponse.json({ error: "This invite is for a different email address" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Add to team
        await prisma.teamMembership.create({
            data: {
                teamId: invite.teamId,
                userId: user.id,
                role: invite.role,
            },
        });

        // Mark invite as accepted
        await prisma.teamInvite.update({
            where: { id: invite.id },
            data: { status: "ACCEPTED" },
        });

        // Notify team owner
        await prisma.notification.create({
            data: {
                userId: invite.team.startup.founderId,
                type: "team_join",
                title: "New team member",
                message: `${user.name || session.user.email} joined your team at ${invite.team.startup.name}`,
                link: "/dashboard/members",
            },
        });

        return NextResponse.json({
            success: true,
            message: `You've joined ${invite.team.startup.name}!`,
        });
    } catch (error) {
        console.error("INVITE_ACCEPT_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
