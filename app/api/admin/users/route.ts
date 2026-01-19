import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, HttpError } from "@/lib/error-handler";

/**
 * GET /api/admin/users
 * Fetch all users - ADMIN only
 */
export const GET = withErrorHandler(async (req: Request) => {
    const limit = await ensureRateLimit(req);
    if (limit) return limit;

    const auth = await ensureAuthResponse();
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;
    if (!session.user.email) throw HttpError.unauthorized();

    // Check for admin role
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
        throw HttpError.forbidden("Access denied. Admin role required.");
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const startup = searchParams.get("startup");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = parseInt(searchParams.get("limit") || "20");
    const take = Math.min(Math.max(limitParam, 1), 100); // Clamp between 1 and 100
    const skip = (page - 1) * take;

    // Build the where clause
    const where: any = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    if (role && role !== "ALL") {
        where.role = role;
    }

    if (startup) {
        where.OR = [
            ...(where.OR || []),
            { startups: { some: { name: { contains: startup, mode: "insensitive" } } } },
            { startupMemberships: { some: { startup: { name: { contains: startup, mode: "insensitive" } } } } }
        ];
    }

    // Fetch filtered users count and data in parallel
    const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.user.count({ where })
    ]);

    return NextResponse.json({ 
        users,
        pagination: {
            total: totalCount,
            pages: Math.ceil(totalCount / take),
            currentPage: page,
            limit: take
        }
    });
});

const updateRoleSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(["DEVELOPER", "FOUNDER", "INVESTOR", "ADMIN"]),
});

/**
 * PUT /api/admin/users
 * Update user role - ADMIN only
 */
export const PUT = withErrorHandler(async (request: Request) => {
    const limit = await ensureRateLimit(request);
    if (limit) return limit;

    const auth = await ensureAuthResponse();
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;
    if (!session.user.email) throw HttpError.unauthorized();

    // Check for admin role
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
        throw HttpError.forbidden("Access denied. Admin role required.");
    }

    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
        throw HttpError.badRequest("Invalid request", validation.error.flatten());
    }

    const { userId, role } = validation.data;

    // Prevent admin from demoting themselves
    if (userId === currentUser.id && role !== "ADMIN") {
        throw HttpError.badRequest("You cannot demote yourself");
    }

    // Update user role
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return NextResponse.json({
        message: "User role updated successfully",
        user: updatedUser,
    });
});

/**
 * DELETE /api/admin/users
 * Delete a user - ADMIN only
 */
export const DELETE = withErrorHandler(async (request: Request) => {
    const limit = await ensureRateLimit(request);
    if (limit) return limit;

    const auth = await ensureAuthResponse();
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;
    if (!session.user.email) throw HttpError.unauthorized();

    // Check for admin role
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
        throw HttpError.forbidden("Access denied. Admin role required.");
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        throw HttpError.badRequest("userId is required");
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
        throw HttpError.badRequest("You cannot delete yourself");
    }

    // Delete user
    await prisma.user.delete({
        where: { id: userId },
    });

    return NextResponse.json({
        message: "User deleted successfully",
    });
});
