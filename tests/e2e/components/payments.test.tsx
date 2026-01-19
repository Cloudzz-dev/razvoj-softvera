import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentModal } from '@/components/payments/PaymentModal';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    X: () => <div data-testid="close-icon" />,
    CreditCard: () => <div data-testid="card-icon" />,
    Wallet: () => <div data-testid="wallet-icon" />,
    Smartphone: () => <div data-testid="smartphone-icon" />,
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

// Mock fetch
global.fetch = vi.fn();

describe('Payments Components', () => {
    describe('PaymentModal', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('renders when open', () => {
            render(<PaymentModal isOpen={true} onClose={() => { }} recipientName="Recipient" recipientId="rec1" />);
            expect(screen.getByRole('heading', { name: 'Send Payment' })).toBeInTheDocument();
            expect(screen.getByText('Recipient')).toBeInTheDocument();
        });

        it('does not render when closed', () => {
            const { container } = render(<PaymentModal isOpen={false} onClose={() => { }} recipientName="Recipient" recipientId="rec1" />);
            expect(container).toBeEmptyDOMElement();
        });

        it('calculates fees and shows details', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ amount: 100, serviceFee: 5, netAmount: 95 }),
            } as Response);

            render(<PaymentModal isOpen={true} onClose={() => { }} recipientName="Recipient" recipientId="rec1" />);

            const amountInput = screen.getByLabelText('Amount (USD)');
            fireEvent.change(amountInput, { target: { value: '100' } });

            // Wait for debounce and fetch
            await waitFor(() => {
                expect(screen.getByText('Recipient Receives')).toBeInTheDocument();
                expect(screen.getByText('$95.00')).toBeInTheDocument();
            });
        });

        it('submits payment', async () => {
            vi.mocked(global.fetch).mockImplementation((url) => {
                const urlString = url.toString();
                if (urlString.includes('calculate')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ amount: 100, serviceFee: 5, netAmount: 95 }),
                    } as Response);
                }
                if (urlString.includes('send')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ success: true }),
                    } as Response);
                }
                return Promise.reject('Unknown url');
            });

            const onClose = vi.fn();
            render(<PaymentModal isOpen={true} onClose={onClose} recipientName="Recipient" recipientId="rec1" />);

            const amountInput = screen.getByLabelText('Amount (USD)');
            fireEvent.change(amountInput, { target: { value: '100' } });

            await waitFor(() => {
                expect(screen.getByText('$95.00')).toBeInTheDocument();
            });

            const submitBtn = screen.getByRole('button', { name: /Send \$100.00/ });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
            });
        });
    });
});
