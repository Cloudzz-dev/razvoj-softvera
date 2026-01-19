import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "25");
        const skip = (page - 1) * limit;

        // Fetch all startups from database
        const startups = await prisma.startup.findMany({
            include: {
                founder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        eoaAddress: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        });

        return NextResponse.json(startups);
    } catch (error) {
        console.error("STARTUPS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { name, pitch, stage, websiteUrl, logo, raised, teamSize } = body;

        if (!name || !pitch || !stage) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Create startup and membership in transaction
        const result = await prisma.$transaction(async (tx) => {
            const startup = await tx.startup.create({
                data: {
                    name,
                    pitch,
                    stage,
                    websiteUrl,
                    logo,
                    raised,
                    teamSize: parseInt(teamSize) || 1,
                    founderId: user.id,
                },
                include: {
                    founder: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            await tx.startupMembership.create({
                data: {
                    startupId: startup.id,
                    userId: user.id,
                    role: "Founder",
                },
            });

            // Create Team for the startup
            const team = await tx.team.create({
                data: {
                    startupId: startup.id,
                },
            });

            // Add Founder to Team as OWNER
            await tx.teamMembership.create({
                data: {
                    teamId: team.id,
                    userId: user.id,
                    role: "OWNER",
                },
            });

            // Update user role to FOUNDER if not already (optional, but good for consistency)
            if (user.role !== "ADMIN" && user.role !== "FOUNDER") {
                await tx.user.update({
                    where: { id: user.id },
                    data: { role: "FOUNDER" },
                });
            }

            return startup;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("STARTUP_CREATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
