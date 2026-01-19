import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, hasPermission } from "@/lib/api-key-auth";

/**
 * GET /api/v1/startups
 * List all startups - supports both session and API key authentication
 */
export async function GET(request: Request) {
    // Authenticate using session or API key
    const authResult = await authenticateRequest(request);

    if (!authResult.authenticated || !authResult.userId) {
        return NextResponse.json(
            { error: authResult.error || "Unauthorized" },
            { status: 401 }
        );
    }

    // Check read permission
    if (!hasPermission(authResult.permissions || [], "read")) {
        return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
        );
    }

    try {
        const startups = await prisma.startup.findMany({
            include: {
                founder: {
                    select: {
                        name: true,
                        id: true,
                        eoaAddress: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const formattedStartups = startups.map((s) => ({
            ...s,
            founder: s.founder.name,
            founderId: s.founder.id,
            eoaAddress: s.founder.eoaAddress,
        }));

        return NextResponse.json({
            data: formattedStartups,
            meta: {
                total: startups.length,
                page: 1,
                limit: startups.length,
            },
        });
    } catch (error) {
        console.error("Startups fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

