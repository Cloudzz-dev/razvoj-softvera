import { describe, it, expect, vi, beforeEach } from 'vitest';


vi.mock('resend', () => {
    return {
        Resend: class {
            emails = {
                send: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null }),
            };
        }
    };
});

vi.stubEnv('RESEND_API_KEY', 're_test_123');

describe('lib/email', async () => {
    // Import dynamically to ensure mocks are applied
    const { sendVerificationEmail, generateVerificationCode } = await import('@/lib/email');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate a 6-digit code', () => {
        const code = generateVerificationCode();
        expect(code).toMatch(/^\d{6}$/);
    });

    it('should send verification email successfully', async () => {
        const result = await sendVerificationEmail({
            to: 'test@example.com',
            name: 'Test',
            code: '123456',
        });
        expect(result).toEqual({ id: 'email-id' });
    });

    it('should throw error if API key is missing', async () => {
        vi.stubEnv('RESEND_API_KEY', '');
        vi.resetModules(); // Clear cache to force re-evaluation of env var check

        // We need to re-import or use a fresh isolate to trigger the top-level check if it exists,
        // but since the check is likely inside the function or lazy, this might work:
        const { sendVerificationEmail } = await import('@/lib/email');

        // If the check is inside the function:
        await expect(sendVerificationEmail({ to: 't', name: 't', code: '1' }))
            .rejects.toThrow('RESEND_API_KEY');
    });
});
