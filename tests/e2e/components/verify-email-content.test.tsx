import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerifyEmailContent } from '@/app/verify-email/VerifyEmailContent';

// Mock Next.js hooks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: () => 'test@example.com' }), // Default email
}));

describe('VerifyEmailContent', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders email from search params', () => {
        render(<VerifyEmailContent />);
        expect(screen.getByText('test@example.com')).toBeDefined();
    });

    it('handles input and submission', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        } as Response);

        render(<VerifyEmailContent />);

        const inputs = screen.getAllByRole('textbox'); // inputs having inputMode="numeric" might not be role textbox? actually type="text" so yes.

        // Fill inputs
        for (let i = 0; i < 6; i++) {
            fireEvent.change(inputs[i], { target: { value: '1' } });
        }

        // Wait for submit (auto-submit)
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/verify-email', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com', code: '111111' }),
            }));
        });

        // Check success state
        await waitFor(() => {
            expect(screen.getByText('Email Verified!')).toBeDefined();
        });

        // Check redirect
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        }, { timeout: 2500 });
    });

    it('displays error on failed verification', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Invalid code' }),
        } as Response);

        render(<VerifyEmailContent />);
        const inputs = screen.getAllByRole('textbox');

        // Fill inputs
        for (let i = 0; i < 6; i++) {
            fireEvent.change(inputs[i], { target: { value: '1' } });
        }

        await waitFor(() => {
            expect(screen.getByText('Invalid code')).toBeDefined();
        });
    });
});
