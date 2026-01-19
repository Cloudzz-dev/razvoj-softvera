import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionHistory } from '@/components/payments/TransactionHistory';

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
    },
}));

// Mock icons
vi.mock('lucide-react', () => ({
    ArrowUpRight: () => <div data-testid="arrow-up" />,
    ArrowDownLeft: () => <div data-testid="arrow-down" />,
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: { user: { id: 'dev_1', email: 'test@example.com' } } }),
}));

describe('TransactionHistory', () => {
    const mockTransactions = [
        {
            id: 'tx-1',
            sender: { name: 'Alice', email: 'alice@example.com', image: null },
            senderId: 'user-2',
            receiver: { name: 'Dev', email: 'dev@example.com', image: null },
            receiverId: 'dev_1',
            amount: 100,
            serviceFee: 5,
            netAmount: 95,
            status: 'COMPLETED',
            date: '2024-01-01T12:00:00Z',
            description: 'Payment for services',
            provider: 'CARD',
        },
    ];

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows loading state initially', () => {
        vi.mocked(fetch).mockImplementation(() => new Promise(() => { })); // Never resolves
        render(<TransactionHistory />);
        expect(screen.getByText('Loading transactions...')).toBeDefined();
    });

    it('renders transactions successfully', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => mockTransactions,
        } as Response);

        render(<TransactionHistory />);

        expect(await screen.findByText('From Alice')).toBeDefined();
        expect(await screen.findByText('Payment for services')).toBeDefined();
        expect(await screen.findByText((content, element) => {
            return element?.textContent === '+$95.00';
        })).toBeDefined();
    });

    it('shows empty state when no transactions', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => [],
        } as Response);

        render(<TransactionHistory />);

        await waitFor(() => {
            expect(screen.getByText('No transactions found.')).toBeDefined();
        });
    });

    it('handles fetch error', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
        } as Response);

        const { default: toast } = await import('react-hot-toast');

        render(<TransactionHistory />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Could not load transaction history.');
        });
    });
});
