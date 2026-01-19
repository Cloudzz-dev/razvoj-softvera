/**
 * API Key Generation Utilities
 * 
 * Provides secure key generation with bcrypt hashing.
 * Only the plaintext key is shown once to the user.
 */

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const KEY_PREFIX = "sk_live_";
const KEY_LENGTH = 32; // 32 bytes = 64 hex chars
const BCRYPT_ROUNDS = 12;

export interface GeneratedApiKey {
    /** Full plaintext key to show user ONCE */
    plaintext: string;
    /** Bcrypt hash for secure storage */
    keyHash: string;
    /** Prefix + first 8 chars for display/lookup */
    keyPrefix: string;
}

/**
 * Generate a new API key with secure hashing
 * 
 * @returns Object containing plaintext (show once), hash (store), and prefix (for lookup)
 */
export async function generateApiKey(): Promise<GeneratedApiKey> {
    // Generate cryptographically secure random bytes
    const randomPart = randomBytes(KEY_LENGTH).toString("hex");
    const plaintext = `${KEY_PREFIX}${randomPart}`;

    // Create hash for secure storage
    const keyHash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);

    // Create prefix for display and fast lookup (prefix + first 8 chars of random)
    const keyPrefix = `${KEY_PREFIX}${randomPart.substring(0, 8)}`;

    return {
        plaintext,
        keyHash,
        keyPrefix,
    };
}

/**
 * Verify an API key against its stored hash
 * 
 * @param plaintextKey - The full API key provided by the client
 * @param storedHash - The bcrypt hash stored in the database
 * @returns True if the key matches the hash
 */
export async function verifyApiKey(
    plaintextKey: string,
    storedHash: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(plaintextKey, storedHash);
    } catch {
        return false;
    }
}

/**
 * Extract the key prefix from a full API key for database lookup
 * 
 * @param plaintextKey - The full API key
 * @returns The key prefix (sk_live_ + first 8 chars)
 */
export function extractKeyPrefix(plaintextKey: string): string {
    if (!plaintextKey.startsWith(KEY_PREFIX)) {
        return "";
    }
    // Get the prefix + first 8 chars of the random part
    return plaintextKey.substring(0, KEY_PREFIX.length + 8);
}

/**
 * Validate API key format
 * 
 * @param key - The API key to validate
 * @returns True if the key has valid format
 */
export function isValidApiKeyFormat(key: string): boolean {
    // Must start with prefix and have full length
    const expectedLength = KEY_PREFIX.length + (KEY_LENGTH * 2); // hex encoding doubles length
    return key.startsWith(KEY_PREFIX) && key.length === expectedLength;
}
