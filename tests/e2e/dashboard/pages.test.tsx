import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '@/app/dashboard/page';
import SettingsPage from '@/app/dashboard/settings/page';
import InvestorDashboard from '@/app/dashboard/investor/page';
import ApiPage from '@/app/dashboard/api-access/page';

// Mock next-auth/react
const mockSession = {
    data: {
        user: { name: 'Test User', email: 'test@example.com', role: 'USER' }
    },
    status: 'authenticated'
};
vi.mock('next-auth/react', () => ({
    useSession: () => mockSession,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
}));

// Mock next-auth for server components
vi.mock('next-auth', () => ({
    getServerSession: () => Promise.resolve({
        user: { name: 'Test User', email: 'test@example.com', role: 'USER' }
    }),
}));

// Mock complex components
vi.mock('@/components/dashboard/GrowthDashboard', () => ({
    GrowthDashboard: () => <div data-testid="growth-dashboard">Growth Dashboard</div>,
}));

vi.mock('@/components/ui/MetricsChart', () => ({
    MetricsChart: ({ title }: any) => <div data-testid="metrics-chart">{title}</div>,
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

// Mock server-side dashboard queries
vi.mock('@/lib/dashboard-queries', () => ({
    getDashboardStats: vi.fn(() => Promise.resolve({
        connections: 10,
        startups: 5,
        investors: 2,
        growth: '15%'
    })),
    getRecentActivity: vi.fn(() => Promise.resolve([
        { id: '1', message: 'New connection', createdAt: new Date().toISOString() }
    ])),
    getGrowthMetrics: vi.fn(() => Promise.resolve({
        revenue: []
    })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard Pages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('DashboardPage', () => {
        const mockStats = {
            connections: 10,
            startups: 5,
            investors: 2,
            growth: '15%',
        };
        const mockActivity = [
            { id: '1', message: 'New connection', createdAt: new Date().toISOString() }
        ];

        it('renders stats and activity after fetch', async () => {
            vi.mocked(global.fetch).mockImplementation((url) => {
                if (url === '/api/dashboard/stats') return Promise.resolve({ ok: true, json: async () => mockStats } as any);
                if (url === '/api/dashboard/activity') return Promise.resolve({ ok: true, json: async () => mockActivity } as any);
                return Promise.reject(new Error('Unknown URL: ' + url));
            });

            const ui = await DashboardPage();
            render(ui);

            await waitFor(() => {
                expect(screen.getByText('Connections')).toBeInTheDocument();
                expect(screen.getByText('10')).toBeInTheDocument();
                expect(screen.getByText('New connection')).toBeInTheDocument();
            });

            expect(screen.getByTestId('growth-dashboard')).toBeInTheDocument();
        });
    });

    describe('SettingsPage', () => {
        const mockSettings = {
            user: { name: 'Test User', email: 'test@example.com' },
            profile: { bio: 'Test Bio', location: 'Remote', skills: ['React'] }
        };

        it('renders user settings', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => mockSettings,
            } as any);

            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
                expect(screen.getByDisplayValue('Test Bio')).toBeInTheDocument();
            });

            expect(screen.getByText('React')).toBeInTheDocument();
        });

        it('submits form updates', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => mockSettings,
            } as any);

            render(<SettingsPage />);
            await waitFor(() => screen.getByDisplayValue('Test User'));

            const nameInput = screen.getByDisplayValue('Test User');
            fireEvent.change(nameInput, { target: { value: 'Updated User' } });

            const saveBtn = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveBtn);

            expect(global.fetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining('Updated User')
            }));
        });
    });

    describe('InvestorDashboard', () => {
        it('renders investor widgets', async () => {
            vi.mocked(global.fetch).mockImplementation((url) => {
                // Mock all necessary endpoints for Investor Dashboard
                if (url === '/api/dashboard/stats') return Promise.resolve({ ok: true, json: async () => ({ profile: { firm: 'VC Corp' } }) } as any);
                if (url === '/api/transactions?filter=sent') return Promise.resolve({ ok: true, json: async () => [] } as any);
                if (url === '/api/v1/startups') return Promise.resolve({ ok: true, json: async () => ({ data: [] }) } as any);
                if (url === '/api/growth?timeRange=year') return Promise.resolve({ ok: true, json: async () => ({ revenue: [] }) } as any);
                return Promise.resolve({ ok: true, json: async () => ({}) } as any);
            });

            render(<InvestorDashboard />);

            await waitFor(() => {
                expect(screen.getByText('Investor Dashboard')).toBeInTheDocument();
                expect(screen.getByText('VC Corp')).toBeInTheDocument(); // Profile firm check
            });
        });
    });

    describe('ApiPage', () => {
        const mockKeys = [
            { id: '1', name: 'Test Key', key: 'pk_test_...', isActive: true, createdAt: new Date().toISOString() }
        ];

        it('renders API keys list', async () => {
            vi.mocked(global.fetch).mockImplementation((url) => {
                if (url === '/api/keys') return Promise.resolve({ ok: true, json: async () => mockKeys } as any);
                if (url === '/api/documentation') return Promise.resolve({ ok: true, json: async () => ({ authentication: {}, endpoints: [], rateLimit: {} }) } as any);
                return Promise.resolve({ ok: true, json: async () => ({}) } as any);
            });

            render(<ApiPage />);

            await waitFor(() => {
                expect(screen.getByText('Developer API')).toBeInTheDocument();
                expect(screen.getByText('Test Key')).toBeInTheDocument();
            });
        });
    });
});
