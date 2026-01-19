import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrowthDashboard } from '@/components/dashboard/GrowthDashboard';
import { DashboardSearch } from '@/components/dashboard/DashboardSearch';
import { UserNav } from '@/components/dashboard/UserNav';

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/network',
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => mockSearchParams,
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    TrendingUp: () => <div data-testid="trending-up" />,
    TrendingDown: () => <div data-testid="trending-down" />,
    Users: () => <div data-testid="users-icon" />,
    DollarSign: () => <div data-testid="dollar-icon" />,
    Search: () => <div data-testid="search-icon" />,
    SlidersHorizontal: () => <div data-testid="sliders-icon" />,
    X: () => <div data-testid="x-icon" />,
    LogOut: () => <div data-testid="logout-icon" />,
    Settings: () => <div data-testid="settings-icon" />,
    User: () => <div data-testid="user-icon" />,
}));

// Mock MetricsChart to avoid complex charting logic
vi.mock('@/components/ui/MetricsChart', () => ({
    MetricsChart: ({ title }: any) => <div data-testid="metrics-chart">{title}</div>,
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn() },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GrowthDashboard', () => {
        const mockGrowthData = {
            connections: [{ date: '2024-01-01', value: 10 }, { date: '2024-01-02', value: 20 }],
            revenue: [{ date: '2024-01-01', value: 1000 }, { date: '2024-01-02', value: 2000 }],
            users: [{ date: '2024-01-01', value: 5 }, { date: '2024-01-02', value: 8 }],
        };

        it('renders loading state initially', () => {
            vi.mocked(global.fetch).mockReturnValue(new Promise(() => { })); // Never resolves
            const { container } = render(<GrowthDashboard />);
            // Should render skeleton which has animate-pulse
            expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        });

        it('renders data after fetch', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => mockGrowthData,
            } as any);

            render(<GrowthDashboard />);

            await waitFor(() => {
                expect(screen.getByText('Total Connections')).toBeInTheDocument();
                // Check if values are rendered (last value)
                expect(screen.getByText('20')).toBeInTheDocument(); // Connections
                expect(screen.getByText('$2.0K')).toBeInTheDocument(); // Revenue
            });

            // Check if charts are rendered
            expect(screen.getAllByTestId('metrics-chart')).toHaveLength(3);
        });

        it('handles fetch error', async () => {
            vi.mocked(global.fetch).mockRejectedValue(new Error('Fetch failed'));
            const mod = await import('react-hot-toast');
            const toast = mod.default;

            render(<GrowthDashboard />);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Could not load growth analytics.');
            });
        });
    });

    describe('DashboardSearch', () => {
        it('renders search input', () => {
            render(<DashboardSearch />);
            expect(screen.getByPlaceholderText('Search by skills...')).toBeInTheDocument(); // Based on /dashboard/network mock
        });

        it('handles search input change', () => {
            render(<DashboardSearch />);
            const input = screen.getByPlaceholderText('Search by skills...');
            fireEvent.change(input, { target: { value: 'React' } });

            expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('search=React'));
        });

        it('toggles filter dropdown', () => {
            render(<DashboardSearch />);
            const filterBtn = screen.getByTestId('sliders-icon').parentElement!;
            fireEvent.click(filterBtn);

            expect(screen.getByText('Filter by Skills')).toBeInTheDocument();
            expect(screen.getByText('React')).toBeInTheDocument();
        });
    });

    describe('UserNav', () => {
        it('renders user info from session', async () => {
            const { useSession } = await import('next-auth/react');
            vi.mocked(useSession).mockReturnValue({
                data: {
                    user: { name: 'Test User', email: 'test@example.com', image: 'https://example.com/pic.jpg' }
                },
                status: 'authenticated'
            } as any);

            render(<UserNav />);

            expect(screen.getByText('Test User')).toBeInTheDocument();
            expect(screen.getByAltText('Test User')).toHaveAttribute('src', 'https://example.com/pic.jpg');
        });

        it('renders guest info when no session', async () => {
            const { useSession } = await import('next-auth/react');
            vi.mocked(useSession).mockReturnValue({
                data: null,
                status: 'unauthenticated'
            } as any);

            render(<UserNav />);

            expect(screen.getByText('Guest User')).toBeInTheDocument();
        });
    });
});
