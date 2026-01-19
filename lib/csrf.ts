import { env } from "@/lib/env";

/**
 * Get and validate CSRF secret on demand
 * Fails fast if secrets are not configured in production
 */
function getCsrfSecret(): string {
    // Lazy check: only validate when actually needed
    const secret = env.CSRF_SECRET || env.NEXTAUTH_SECRET;

    if (!secret) {
        const error = new Error(
            "CRITICAL SECURITY ERROR: CSRF_SECRET or NEXTAUTH_SECRET must be configured.\n" +
            "Application cannot generate secure CSRF tokens without a secret.\n" +
            "Please set NEXTAUTH_SECRET in your .env file (minimum 32 characters).\n" +
            "Example: NEXTAUTH_SECRET=\"your-super-secret-key-at-least-32-chars\""
        );
        console.error("🔒 [SECURITY]", error.message);
        throw error;
    }

    if (secret.length < 32) {
        console.warn("⚠️  [SECURITY] CSRF secret is less than 32 characters. Consider using a stronger secret.");
    }

    return secret;
}

// REMOVED top-level execution to prevent crash on import
// const CSRF_SECRET = getCsrfSecret();

/**
 * Generate a new CSRF token
 * Token format: random_value.signature
 * Uses Web Crypto API for Edge compatibility
 */
export async function generateCsrfToken(): Promise<string> {
    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    // Convert to base64url manually since Buffer is not guaranteed
    const randomValue = btoa(String.fromCharCode(...randomBuffer))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const signature = await signToken(randomValue);
    return `${randomValue}.${signature}`;
}

/**
 * Verify a CSRF token using constant-time comparison
 * Prevents timing attacks
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
    if (!token || typeof token !== "string") {
        return false;
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
        return false;
    }

    const [randomValue, providedSignature] = parts;
    const expectedSignature = await signToken(randomValue);

    // Constant-time comparison
    if (providedSignature.length !== expectedSignature.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < providedSignature.length; i++) {
        result |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
}

// Helper to sign token using Web Crypto API
async function signToken(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(getCsrfSecret()); // Lazy fetch
    const data = encoder.encode(value);

    // Import key for HMAC
    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        data
    );

    // Convert ArrayBuffer to base64url properties
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Extract CSRF token from request headers
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
    // Check X-CSRF-Token header first
    const headerToken = request.headers.get("x-csrf-token");
    if (headerToken) {
        return headerToken;
    }

    // Fallback to checking request body for token
    // (will be handled by individual routes if needed)
    return null;
}
