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

        if (id === "demo_startup_1") {
             const { DEMO_TEAM_MEMBERS } = await import("@/lib/demo-data");
             return NextResponse.json({
                members: DEMO_TEAM_MEMBERS,
                pagination: { total: DEMO_TEAM_MEMBERS.length, pages: 1, currentPage: 1, limit: 50 }
             });
        }

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

        // Parse pagination params
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        // Fetch members with pagination
        const [members, total] = await Promise.all([
            prisma.startupMembership.findMany({
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
                take: limit,
                skip: skip,
            }),
            prisma.startupMembership.count({ where: { startupId: id } }),
        ]);

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

        return NextResponse.json({
            members: formattedMembers,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("STARTUP_MEMBERS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
