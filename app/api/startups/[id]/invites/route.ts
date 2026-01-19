import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a member of the startup (or admin)
        const membership = await prisma.startupMembership.findUnique({
            where: {
                startupId_userId: {
                    startupId: id,
                    userId: user.id,
                },
            },
        });

        if (!membership && user.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get startup's team ID
        const startup = await prisma.startup.findUnique({
            where: { id },
            include: { team: true },
        });

        if (!startup?.team) {
            return NextResponse.json([]); // No team yet
        }

        // Fetch pending invites
        const invites = await prisma.teamInvite.findMany({
            where: {
                teamId: startup.team.id,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(invites);
    } catch (error) {
        console.error("STARTUP_INVITES_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
