import { describe, it, expect } from 'vitest';
import { generateApiKey, verifyApiKey, extractKeyPrefix, isValidApiKeyFormat } from '@/lib/api-key-utils';


describe('lib/api-key-utils', () => {
    it('should generate a valid API key', async () => {
        const key = await generateApiKey();
        expect(key.plaintext).toMatch(/^sk_live_/);
        expect(key.keyPrefix).toMatch(/^sk_live_/);
        expect(key.keyHash).toBeDefined();
        // 64 hex chars + 8 prefix chars
        expect(key.plaintext.length).toBe(8 + 64);
    });

    it('should verify a correct key', async () => {
        const { plaintext, keyHash } = await generateApiKey();
        const isValid = await verifyApiKey(plaintext, keyHash);
        expect(isValid).toBe(true);
    });

    it('should fail verification for incorrect key', async () => {
        const { keyHash } = await generateApiKey();
        const isValid = await verifyApiKey('wrong-key', keyHash);
        expect(isValid).toBe(false);
    });

    it('should extract correct prefix', () => {
        const key = 'sk_live_12345678abcdef';
        expect(extractKeyPrefix(key)).toBe('sk_live_12345678');
    });

    it('should return empty string for invalid prefix extraction', () => {
        expect(extractKeyPrefix('invalid_prefix_123')).toBe('');
    });

    it('should validate API key format', () => {
        const validKey = 'sk_live_' + 'a'.repeat(64);
        expect(isValidApiKeyFormat(validKey)).toBe(true);
        expect(isValidApiKeyFormat('sk_live_short')).toBe(false);
        expect(isValidApiKeyFormat('wrong_prefix_' + 'a'.repeat(64))).toBe(false);
    });
});
