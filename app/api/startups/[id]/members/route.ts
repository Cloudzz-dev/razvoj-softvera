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

        // Check if user is a member of the startup
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

        // Fetch all members
        const members = await prisma.startupMembership.findMany({
            where: { startupId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true, // Platform role
                    },
                },
            },
            orderBy: { joinedAt: "asc" },
        });

        const formattedMembers = members.map((m) => ({
            id: m.userId,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
            platformRole: m.user.role,
            startupRole: m.role,
            joinedAt: m.joinedAt,
            isActive: m.isActive,
        }));

        return NextResponse.json(formattedMembers);
    } catch (error) {
        console.error("STARTUP_MEMBERS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
