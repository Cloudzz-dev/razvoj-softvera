import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authenticateApiKey } from "@/lib/api-key-auth";

const fundingSchema = z.object({
    totalRaised: z.string().optional(), // Allow flexible string formats e.g. "$5M"
    stage: z.string().optional(),
    round: z.string().optional(), // e.g. "Series A"
    valuation: z.string().optional(),
    date: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        // 1. Authenticate
        const authResult = await authenticateApiKey(req);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
        }

        // 2. Validate
        const body = await req.json();
        const validation = fundingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: validation.error.format()
            }, { status: 400 });
        }

        const { totalRaised, stage } = validation.data;

        // 3. Update Startup
        // API key owner must be founder
        const startup = await prisma.startup.findFirst({
            where: { founderId: authResult.userId }
        });

        if (!startup) {
            return NextResponse.json({ error: "No startup found for this user." }, { status: 404 });
        }

        const updatedStartup = await prisma.startup.update({
            where: { id: startup.id },
            data: {
                raised: totalRaised || startup.raised,
                stage: stage || startup.stage,
                // We might want to store 'round' in a separate table in the future, 
                // but for now we'll just log it or rely on stage/raised fields as the schema is simple.
                // The schema only has 'raised' and 'stage'.
            }
        });

        return NextResponse.json({
            success: true,
            startup: {
                id: updatedStartup.id,
                name: updatedStartup.name,
                raised: updatedStartup.raised,
                stage: updatedStartup.stage
            }
        });

    } catch (error) {
        console.error("FUNDING_UPDATE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
