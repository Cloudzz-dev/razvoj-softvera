import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authenticateApiKey } from "@/lib/api-key-auth";

const portfolioSchema = z.object({
    companies: z.array(z.object({
        name: z.string(),
        website: z.string().url().optional(),
        investmentDate: z.string().optional(),
        amount: z.string().optional()
    })).min(1)
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
        const validation = portfolioSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: validation.error.format()
            }, { status: 400 });
        }

        // 3. Update Profile
        // We only have a 'portfolio' integer field in the Profile schema currently
        // In a real app we'd have a PortfolioCompany model. 
        // For now, we'll assume this API call sets the count or adds to it?
        // Let's just update the count based on the array length for now to satisfy the schema.

        const count = validation.data.companies.length;

        const profile = await prisma.profile.upsert({
            where: { userId: authResult.userId },
            update: {
                portfolio: count // simple replacement logic for now
            },
            create: {
                userId: authResult.userId,
                portfolio: count
            }
        });

        return NextResponse.json({
            success: true,
            updatedCount: profile.portfolio,
            message: "Portfolio updated successfully"
        });

    } catch (error) {
        console.error("PORTFOLIO_UPDATE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
