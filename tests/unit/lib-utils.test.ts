import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';
import { sanitizeText, sanitizeMessage } from '@/lib/sanitize';
import { registerSchema, paymentSchema } from '@/lib/validations';

describe('lib/utils - cn', () => {
    it('should merge tailwind classes correctly', () => {
        expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
        expect(cn('px-2', 'px-4')).toBe('px-4'); // tailwind-merge logic
        expect(cn('bg-red-500', { 'text-white': true, 'hidden': false })).toBe('bg-red-500 text-white');
    });
});

describe('lib/sanitize', () => {
    it('should sanitize basic text', () => {
        expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
        expect(sanitizeText('  Whitespace  ')).toBe('Whitespace');
    });

    it('should sanitize messages while preserving line breaks', () => {
        const input = 'Hello\n<script></script>World';
        const output = sanitizeMessage(input);
        expect(output).toContain('Hello');
        expect(output).toContain('World');
        expect(output).not.toContain('<script>');
    });
});

describe('lib/validations', () => {
    describe('registerSchema', () => {
        it('should validate correct registration data', () => {
            const data = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123',
                role: 'DEVELOPER'
            };
            expect(registerSchema.safeParse(data).success).toBe(true);
        });

        it('should fail on invalid email', () => {
            const data = {
                name: 'John Doe',
                email: 'not-an-email',
                password: 'Password123',
                role: 'DEVELOPER'
            };
            expect(registerSchema.safeParse(data).success).toBe(false);
        });

        it('should fail on weak password', () => {
            const data = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123',
                role: 'DEVELOPER'
            };
            expect(registerSchema.safeParse(data).success).toBe(false);
        });
    });

    describe('paymentSchema', () => {
        it('should validate correct payment data', () => {
            const data = {
                amount: 100,
                recipientId: 'user-1',
                recipientName: 'Jane Doe',
                provider: 'CARD',
                idempotencyKey: 'test-key-123'
            };
            expect(paymentSchema.safeParse(data).success).toBe(true);
        });

        it('should fail on negative amount', () => {
            const data = {
                amount: -10,
                recipientId: 'user-1',
                recipientName: 'Jane Doe',
                provider: 'CARD'
            };
            expect(paymentSchema.safeParse(data).success).toBe(false);
        });
    });
});
