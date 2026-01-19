import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AiAssistant } from '@/components/ai/AiAssistant';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Bot: () => <div data-testid="bot-icon" />,
    Send: () => <div data-testid="send-icon" />,
    User: () => <div data-testid="user-icon" />,
    Loader2: () => <div data-testid="loader-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Search: () => <div data-testid="search-icon" />,
    Mail: () => <div data-testid="mail-icon" />,
    X: () => <div data-testid="x-icon" />,
    GripHorizontal: () => <div data-testid="grip-icon" />,
    MessageSquare: () => <div data-testid="message-square-icon" />,
}));

// Mock GlassCard
vi.mock('@/components/ui/GlassCard', () => ({
    GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('AI Components', () => {
    describe('AiAssistant', () => {
        it('renders initial state', () => {
            render(<AiAssistant />);
            // Component placeholder is in Croatian
            expect(screen.getByPlaceholderText('Pitaj o startupima...')).toBeInTheDocument();
            expect(screen.getByText('DFDS.io AI')).toBeInTheDocument();
        });

        it('handles user input and submission', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ reply: 'AI Response' }),
            } as any);

            render(<AiAssistant />);
            const input = screen.getByPlaceholderText('Pitaj o startupima...');

            fireEvent.change(input, { target: { value: 'Hello AI' } });
            expect(input).toHaveValue('Hello AI');

            const sendBtn = screen.getByTestId('send-icon').parentElement!;
            fireEvent.click(sendBtn);

            await waitFor(() => {
                expect(screen.getByText('Hello AI')).toBeInTheDocument();
            });
        });
    });
});
