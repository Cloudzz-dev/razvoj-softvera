/**
 * API Key Authentication Middleware
 * 
 * Validates API keys for developer access to protected routes.
 * Supports both session-based and API key authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractKeyPrefix, verifyApiKey, isValidApiKeyFormat } from "@/lib/api-key-utils";

export interface ApiKeyAuthResult {
    authenticated: boolean;
    userId?: string;
    permissions?: string[];
    error?: string;
}

/**
 * Authenticate a request using API key from Authorization header
 * 
 * @param request - The incoming request
 * @returns Authentication result with userId and permissions if successful
 */
export async function authenticateApiKey(
    request: NextRequest | Request
): Promise<ApiKeyAuthResult> {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { authenticated: false, error: "Missing or invalid Authorization header" };
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate key format
    if (!isValidApiKeyFormat(apiKey)) {
        return { authenticated: false, error: "Invalid API key format" };
    }

    // Extract prefix for database lookup
    const keyPrefix = extractKeyPrefix(apiKey);

    if (!keyPrefix) {
        return { authenticated: false, error: "Invalid API key" };
    }

    try {
        // Find potential matches by prefix
        const potentialKeys = await prisma.apiKey.findMany({
            where: {
                keyPrefix,
                isActive: true,
            },
            select: {
                id: true,
                keyHash: true,
                userId: true,
                permissions: true,
                expiresAt: true,
            },
        });

        if (potentialKeys.length === 0) {
            return { authenticated: false, error: "Invalid API key" };
        }

        // Verify against each potential match
        // IMPORTANT: Check ALL keys to prevent timing attacks
        // Do not use early exit (break) when a match is found
        let validKey: typeof potentialKeys[0] | null = null;

        for (const key of potentialKeys) {
            // Check expiration
            const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();

            // Verify the hash (constant-time comparison happens inside verifyApiKey)
            const isValid = await verifyApiKey(apiKey, key.keyHash);

            // Store the valid key but continue checking all keys
            if (isValid && !isExpired && !validKey) {
                validKey = key;
            }
        }

        if (validKey) {
            // Update last used timestamp (fire and forget)
            prisma.apiKey.update({
                where: { id: validKey.id },
                data: { lastUsed: new Date() },
            }).catch(err => console.error("Failed to update lastUsed:", err));

            return {
                authenticated: true,
                userId: validKey.userId,
                permissions: validKey.permissions,
            };
        }

        return { authenticated: false, error: "Invalid API key" };
    } catch (error) {
        console.error("API key authentication error:", error);
        return { authenticated: false, error: "Authentication failed" };
    }
}

/**
 * Authenticate a request using either session or API key
 * 
 * @param request - The incoming request
 * @returns Authentication result with userId
 */
export async function authenticateRequest(
    request: NextRequest | Request
): Promise<ApiKeyAuthResult> {
    // First try session authentication
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
        return {
            authenticated: true,
            userId: session.user.id,
            permissions: ["read", "write"], // Session users get full access
        };
    }

    // Fall back to API key authentication
    return authenticateApiKey(request);
}

/**
 * Middleware wrapper for API routes that require authentication
 * Supports both session and API key authentication
 */
export function withApiKeyAuth(
    handler: (
        request: NextRequest | Request,
        context: { userId: string; permissions: string[] }
    ) => Promise<NextResponse>
) {
    return async (request: NextRequest | Request): Promise<NextResponse> => {
        const authResult = await authenticateRequest(request);

        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Unauthorized" },
                { status: 401 }
            );
        }

        return handler(request, {
            userId: authResult.userId,
            permissions: authResult.permissions || ["read"],
        });
    };
}

/**
 * Check if the user has a specific permission
 */
export function hasPermission(
    permissions: string[],
    required: "read" | "write" | "admin"
): boolean {
    if (permissions.includes("admin")) return true;
    if (required === "write" && permissions.includes("write")) return true;
    if (required === "read" && (permissions.includes("read") || permissions.includes("write"))) return true;
    return false;
}
