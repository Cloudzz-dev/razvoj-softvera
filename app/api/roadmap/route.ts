"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(1000),
});
const updateSchema = z.object({
    featureId: z.string(),
    status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]),
});

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        // Note: We need to fetch the user from DB to be sure about role, 
        // or rely on session if role is included in session callback.
        // Assuming session includes role as per previous checks in codebase.
        const isAdmin = (session.user as any).role === "ADMIN";

        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const body = await req.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid status or ID" }, { status: 400 });
        }

        const { featureId, status } = validation.data;

        await prisma.featureRequest.update({
            where: { id: featureId },
            data: { status },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update feature status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const requests = await prisma.featureRequest.findMany({
            include: {
                _count: {
                    select: { votes: true },
                },
                user: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                votes: session?.user?.id ? {
                    where: {
                        userId: session.user.id
                    },
                    select: {
                        type: true
                    }
                } : false
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Transform to include vote count and user vote status
        const formatted = requests.map((r: any) => ({
            ...r,
            votes: r._count.votes, // Replace votes array with count
            hasVoted: r.votes?.[0]?.type === "UP", // Basic voted check
            // For a real score we would sum UP and substract DOWN
            score: r._count.votes,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching roadmap:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = createSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid input", details: result.error.format() },
                { status: 400 }
            );
        }

        const feature = await prisma.featureRequest.create({
            data: {
                title: result.data.title,
                description: result.data.description,
                userId: session.user.id,
            },
        });

        return NextResponse.json(feature);
    } catch (error) {
        console.error("Error creating feature:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
