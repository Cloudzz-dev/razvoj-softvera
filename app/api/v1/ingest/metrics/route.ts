import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit } from "@/lib/api-security";
import bcrypt from "bcryptjs";

// Helper to validate API key
async function validateApiKey(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const key = authHeader.split(" ")[1];

    if (!key.startsWith("sk_live_")) return null;

    // Extract prefix (sk_live_ + 8 chars)
    const prefix = key.substring(0, 16);

    // Optimization: Limit the number of candidates to prevent DoS via hash collision flooding
    // In a production environment with unique prefixes enforced, this would return 0 or 1.
    const apiKeys = await prisma.apiKey.findMany({
        where: { keyPrefix: prefix, isActive: true },
        take: 5, // Limit candidates to prevent CPU exhaustion loop
        include: { user: true }
    });

    for (const apiKey of apiKeys) {
        const isValid = await bcrypt.compare(key, apiKey.keyHash);
        if (isValid) {
            // Update last used (fire and forget to not block)
            prisma.apiKey.update({
                where: { id: apiKey.id },
                data: { lastUsed: new Date() }
            }).catch(console.error);

            return apiKey;
        }
    }

    return null;
}

export async function POST(req: Request) {
    try {
        // [SECURITY] Rate Limiting
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        // Authenticate
        const apiKey = await validateApiKey(req);
        if (!apiKey) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { metricType, value, metadata, date } = body;

        if (!metricType || value === undefined) {
            return NextResponse.json({ error: "Missing required fields: metricType, value" }, { status: 400 });
        }

        // Create the metric in the database
        const metric = await prisma.metric.create({
            data: {
                type: metricType,
                value: value,
                metadata: metadata || {},
                userId: apiKey.user.id
            }
        });

        console.log(`[INGEST] Metric persisted for ${apiKey.user.email}:`, metric);

        return NextResponse.json({
            success: true,
            metricId: metric.id,
            status: "ingested"
        });

    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
