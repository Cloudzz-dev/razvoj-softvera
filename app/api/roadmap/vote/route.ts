"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const voteSchema = z.object({
    featureId: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = voteSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid input", details: result.error.format() },
                { status: 400 }
            );
        }

        const { featureId } = result.data;
        const userId = session.user.id;

        // Check if vote exists
        const existingVote = await prisma.featureRequestVote.findUnique({
            where: {
                featureRequestId_userId: {
                    featureRequestId: featureId,
                    userId,
                },
            },
        });

        if (existingVote) {
            // Toggle off (remove vote)
            await prisma.featureRequestVote.delete({
                where: {
                    id: existingVote.id,
                },
            });
            return NextResponse.json({ voted: false });
        } else {
            // Add vote
            await prisma.featureRequestVote.create({
                data: {
                    featureRequestId: featureId,
                    userId,
                    type: "UP",
                },
            });
            return NextResponse.json({ voted: true });
        }
    } catch (error) {
        console.error("Error voting:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
