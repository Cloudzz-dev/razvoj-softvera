import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { apiKeySchema } from "@/lib/validations";
import { sanitizeText } from "@/lib/sanitize";
import { ZodError } from "zod";
import { generateApiKey } from "@/lib/api-key-utils";

const MAX_KEYS_PER_USER = 5;

// GET - List user's API keys
export async function GET(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const apiKeys = await prisma.apiKey.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                keyPrefix: true,
                name: true,
                isActive: true,
                permissions: true,
                lastUsed: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Format response with masked keys
        const formattedKeys = apiKeys.map(k => ({
            id: k.id,
            name: k.name,
            key: `${k.keyPrefix}...`, // Show only prefix
            isActive: k.isActive,
            permissions: k.permissions,
            lastUsed: k.lastUsed,
            createdAt: k.createdAt,
            expiresAt: k.expiresAt,
        }));

        return NextResponse.json(formattedKeys);
    } catch (error) {
        console.error("API_KEYS_LIST_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Create new API key
export async function POST(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Validate input with Zod
        const body = await req.json();
        const validatedData = apiKeySchema.parse(body);

        // Check if user already has max keys
        const existingCount = await prisma.apiKey.count({
            where: { userId: user.id },
        });

        if (existingCount >= MAX_KEYS_PER_USER) {
            return NextResponse.json(
                { error: `Maximum of ${MAX_KEYS_PER_USER} API keys allowed` },
                { status: 400 }
            );
        }

        // Generate secure API key
        const { plaintext, keyHash, keyPrefix } = await generateApiKey();

        // Extract permissions from request (default to read-only)
        const permissions = validatedData.permissions || ["read"];

        const apiKey = await prisma.apiKey.create({
            data: {
                keyHash,
                keyPrefix,
                name: sanitizeText(validatedData.name),
                userId: user.id,
                permissions,
                isActive: true,
            },
        });

        // Return plaintext key ONLY ONCE
        return NextResponse.json({
            id: apiKey.id,
            name: apiKey.name,
            key: plaintext, // Full key shown only once
            keyPrefix: keyPrefix,
            permissions: apiKey.permissions,
            createdAt: apiKey.createdAt,
            message: "Store this key securely. It will not be shown again.",
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("API_KEY_CREATE_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
