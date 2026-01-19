/**
 * Secure API Key Proxy
 * 
 * This server-side utility safely accesses API keys without exposing them
 * to the client or storing them in version-controlled configuration files.
 * 
 * SECURITY PRINCIPLES:
 * 1. Keys are ONLY accessed server-side via process.env
 * 2. Keys are NEVER sent to client or logged
 * 3. All external API calls go through this proxy
 */

import { env } from "@/lib/env";

// Define which external services we proxy
type ServiceType = "internal" | "external";

interface ProxyConfig {
    service: ServiceType;
    baseUrl?: string;
}

/**
 * Get API key for internal service usage
 * This should ONLY be called from server-side code (API routes, Server Components)
 */
export function getInternalApiKey(): string | null {
    // Access from environment variable - NEVER from config files
    const key = process.env.INTERNAL_API_KEY;

    if (!key) {
        console.warn("[API Proxy] INTERNAL_API_KEY not configured in environment");
        return null;
    }

    // Validate key format
    if (!key.startsWith("sk_")) {
        console.error("[API Proxy] Invalid key format - must start with sk_");
        return null;
    }

    return key;
}

/**
 * Make an authenticated request to an internal API endpoint
 * Use this instead of directly including API keys in fetch calls
 */
export async function proxyInternalRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const key = getInternalApiKey();

    if (!key) {
        throw new Error("API key not configured. Set INTERNAL_API_KEY in .env");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${key}`);

    // Construct URL - for internal calls, use relative paths
    const url = endpoint.startsWith("http")
        ? endpoint
        : `${env.NEXTAUTH_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    return response;
}

/**
 * Validate that code is running server-side
 * Throws if called from client
 */
export function assertServerSide(context: string): void {
    if (typeof window !== "undefined") {
        throw new Error(
            `[SECURITY] ${context} can only be called server-side. ` +
            `Move this logic to an API route or Server Component.`
        );
    }
}

/**
 * Securely log API activity without exposing keys
 */
export function logApiCall(service: string, endpoint: string, status: number): void {
    // Never log the actual key - only metadata
    console.log(`[API Proxy] ${service} -> ${endpoint} (${status})`);
}
