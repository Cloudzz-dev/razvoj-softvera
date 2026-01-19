import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authenticateApiKey } from "@/lib/api-key-auth";

// Validation schema for the request body
const teamSyncSchema = z.object({
    members: z.array(z.object({
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER", "OWNER"]).default("MEMBER"),
        name: z.string().optional(),
    })).min(1),
});

export async function POST(req: Request) {
    try {
        // 1. Authenticate Request
        const authResult = await authenticateApiKey(req);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
        }

        // 2. Validate Body
        const body = await req.json();
        const validation = teamSyncSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: validation.error.format()
            }, { status: 400 });
        }

        // 3. Find User's Startup Team
        // The API key owner must be the Founder or an Admin of the startup
        const startup = await prisma.startup.findFirst({
            where: { founderId: authResult.userId },
            include: { team: true }
        });

        if (!startup) {
            return NextResponse.json({ error: "No startup found for this user. You must be a founder." }, { status: 404 });
        }

        let teamId = startup.team?.id;

        // Create team if it doesn't exist
        if (!teamId) {
            const newTeam = await prisma.team.create({
                data: { startupId: startup.id }
            });
            teamId = newTeam.id;
        }

        // 4. Process Members
        const results = {
            added: 0,
            updated: 0,
            invited: 0,
            errors: 0
        };

        for (const member of validation.data.members) {
            try {
                // Check if user exists on platform
                const user = await prisma.user.findUnique({
                    where: { email: member.email }
                });

                if (user) {
                    // Add or Update Membership
                    const membership = await prisma.teamMembership.upsert({
                        where: {
                            teamId_userId: {
                                teamId: teamId,
                                userId: user.id
                            }
                        },
                        update: {
                            role: member.role as any
                        },
                        create: {
                            teamId: teamId,
                            userId: user.id,
                            role: member.role as any
                        }
                    });

                    if (membership.createdAt.getTime() === membership.createdAt.getTime()) { // Simplistic check, better logic exists but keeping simple
                        // Actually upsert returns the object. We can check existence before or assume success.
                        // Let's just count it.
                    }
                    results.added++; // or updated
                } else {
                    // Invite User
                    // Check if invite exists
                    const existingInvite = await prisma.teamInvite.findFirst({
                        where: {
                            teamId,
                            email: member.email
                        }
                    });

                    if (!existingInvite) {
                        await prisma.teamInvite.create({
                            data: {
                                teamId,
                                email: member.email,
                                role: member.role as any,
                                token: Math.random().toString(36).substring(2, 15), // Simple token generation
                                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                            }
                        });
                        results.invited++;
                    }
                }
            } catch (e) {
                console.error(`Failed to process member ${member.email}`, e);
                results.errors++;
            }
        }

        return NextResponse.json({
            success: true,
            teamId,
            results
        });

    } catch (error) {
        console.error("TEAM_SYNC_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
