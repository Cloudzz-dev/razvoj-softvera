import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const rateLimit = await ensureRateLimit(req);
        if (rateLimit) return rateLimit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const startups = await prisma.startup.findMany({
            where: {
                memberships: {
                    some: {
                        userId: user.id
                    }
                }
            },
            include: {
                founder: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                memberships: {
                    where: {
                        userId: user.id
                    },
                    select: {
                        role: true,
                        joinedAt: true,
                        isActive: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to include the user's role directly in the object for easier frontend consumption
        const result = startups.map(startup => ({
            ...startup,
            // The user's role in this specific startup
            myRole: startup.memberships[0]?.role || 'Member',
            joinedAt: startup.memberships[0]?.joinedAt,
            // Clean up the memberships array from the response if not needed, or keep it
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("USER_STARTUPS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
