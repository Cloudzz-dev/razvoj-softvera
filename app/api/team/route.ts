import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/team
 * Get team members for user's startup
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find user's startup (as founder) or team membership
        const startup = await prisma.startup.findFirst({
            where: { founderId: user.id },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                        role: true,
                                        profile: {
                                            select: {
                                                bio: true,
                                                location: true,
                                                avatarUrl: true,
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: { createdAt: "asc" },
                        },
                        invites: {
                            where: { status: "PENDING" },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        });

        if (!startup) {
            // Check if user is member of any team
            const membership = await prisma.teamMembership.findFirst({
                where: { userId: user.id },
                include: {
                    team: {
                        include: {
                            startup: true,
                            members: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            image: true,
                                            role: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (membership) {
                return NextResponse.json({
                    team: {
                        id: membership.team.id,
                        startupName: membership.team.startup.name,
                        members: membership.team.members.map(m => ({
                            id: m.id,
                            userId: m.userId,
                            role: m.role,
                            user: m.user,
                            createdAt: m.createdAt,
                        })),
                        invites: [],
                        userRole: membership.role,
                    },
                });
            }

            return NextResponse.json({ team: null });
        }

        // Create team if it doesn't exist for founder
        let team = startup.team;
        if (!team) {
            team = await prisma.team.create({
                data: {
                    startupId: startup.id,
                    members: {
                        create: {
                            userId: user.id,
                            role: "OWNER",
                        },
                    },
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    image: true,
                                    role: true,
                                    profile: {
                                        select: {
                                            bio: true,
                                            location: true,
                                            avatarUrl: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    invites: true,
                },
            });
        }

        return NextResponse.json({
            team: {
                id: team.id,
                startupName: startup.name,
                members: team.members.map(m => ({
                    id: m.id,
                    userId: m.userId,
                    role: m.role,
                    user: m.user,
                    createdAt: m.createdAt,
                })),
                invites: team.invites,
                userRole: "OWNER",
            },
        });
    } catch (error) {
        console.error("TEAM_GET_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
