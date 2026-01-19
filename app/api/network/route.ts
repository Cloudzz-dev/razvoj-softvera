import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

export async function GET(request: Request) {
    try {
        const limit = await ensureRateLimit(request);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get("role");
        const page = parseInt(searchParams.get("page") || "1");
        const limitParam = parseInt(searchParams.get("limit") || "25");
        const cursor = searchParams.get("cursor");

        // Calculate skip only if using offset-based pagination (no cursor)
        const skip = cursor ? 1 : (page - 1) * limitParam;

        const search = searchParams.get("search");

        // Build filter based on role and search
        const where: any = {};
        if (roleFilter && ["DEVELOPER", "FOUNDER", "INVESTOR"].includes(roleFilter)) {
            where.role = roleFilter;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Fetch users (excluding current user)
        const users = await prisma.user.findMany({
            where: {
                ...where,
                email: { not: session.user.email },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        bio: true,
                        location: true,
                        skills: true,
                        avatarUrl: true,
                    },
                },
                _count: {
                    select: {
                        startups: true,
                        followers: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limitParam,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip }),
        });

        const nextCursor = users.length === limitParam ? users[users.length - 1].id : undefined;

        return NextResponse.json({
            items: users,
            nextCursor
        });
    } catch (error) {
        console.error("NETWORK_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
