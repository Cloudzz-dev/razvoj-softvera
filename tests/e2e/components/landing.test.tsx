import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CallToAction } from '@/components/landing/CallToAction';
import { ModernFooter } from '@/components/landing/ModernFooter';
import { CookieConsent } from '@/components/ui/CookieConsent';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
        h1: ({ children, className, ...props }: any) => <h1 className={className} {...props}>{children}</h1>,
        p: ({ children, className, ...props }: any) => <p className={className} {...props}>{children}</p>,
        a: ({ children, className, ...props }: any) => <a className={className} {...props}>{children}</a>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useReducedMotion: () => false,
}));

// Mock inner components
vi.mock('@/components/ui/GlassCard', () => ({
    GlassCard: ({ children, className }: any) => <div className={className} data-testid="glass-card">{children}</div>,
}));

vi.mock('@/components/ui/DynamicIsland', () => ({
    DynamicIsland: () => <div data-testid="dynamic-island" />,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    ArrowRight: () => <div data-testid="arrow-right" />,
    Code2: () => <div data-testid="code-icon" />,
    Rocket: () => <div data-testid="rocket-icon" />,
    TrendingUp: () => <div data-testid="trending-up-icon" />,
    Search: () => <div data-testid="search-icon" />,
    MessageSquare: () => <div data-testid="message-icon" />,
    DollarSign: () => <div data-testid="dollar-icon" />,
    Github: () => <div data-testid="github-icon" />,
    Twitter: () => <div data-testid="twitter-icon" />,
    Linkedin: () => <div data-testid="linkedin-icon" />,
    Mail: () => <div data-testid="mail-icon" />,
    Cookie: () => <div data-testid="cookie-icon" />,
    X: () => <div data-testid="x-icon" />,
    Shield: () => <div data-testid="shield-icon" />,
    Heart: () => <div data-testid="heart-icon" />,
}));

describe('Landing Components', () => {
    describe('HeroSection', () => {
        it('renders main heading and description', () => {
            render(<HeroSection />);
            expect(screen.getByText('Build the Future.')).toBeInTheDocument();
            expect(screen.getByText('DFDS.io connects visionary founders', { exact: false })).toBeInTheDocument();
        });

        it('renders CTA buttons', () => {
            render(<HeroSection />);
            expect(screen.getByRole('link', { name: "Join the DFDS.io network" })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: "Login to DFDS.io" })).toBeInTheDocument();
        });

        it('renders feature cards', () => {
            render(<HeroSection />);
            expect(screen.getAllByTestId('glass-card')).toHaveLength(3);
            expect(screen.getByText('For Developers')).toBeInTheDocument();
            expect(screen.getByText('For Founders')).toBeInTheDocument();
            expect(screen.getByText('For Investors')).toBeInTheDocument();
        });
    });

    describe('HowItWorks', () => {
        it('renders section title', () => {
            render(<HowItWorks />);
            expect(screen.getByText('How DFDS.io Works')).toBeInTheDocument();
        });

        it('renders all steps', () => {
            render(<HowItWorks />);
            expect(screen.getAllByTestId('glass-card')).toHaveLength(4);
            expect(screen.getByText('Create Your Profile')).toBeInTheDocument();
            expect(screen.getByText('Grow Together')).toBeInTheDocument();
        });
    });

    describe('CallToAction', () => {
        it('renders final CTA', () => {
            render(<CallToAction />);
            expect(screen.getByText('Ready to build the next unicorn?')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /Get Started Now/i })).toBeInTheDocument();
        });
    });

    describe('ModernFooter', () => {
        it('renders footer links', () => {
            render(<ModernFooter />);
            expect(screen.getByText('Discover')).toBeInTheDocument();
            expect(screen.getByText('Company')).toBeInTheDocument();
            expect(screen.getByText('Stay Updated')).toBeInTheDocument();
        });

        it('renders copyright', () => {
            render(<ModernFooter />);
            expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
        });
    });

    describe('CookieConsent', () => {
        const localStorageMock = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: vi.fn((key: string) => store[key] || null),
                setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
                removeItem: vi.fn((key: string) => { delete store[key]; }),
                clear: vi.fn(() => { store = {}; }),
            };
        })();

        // Mock fetch
        const globalFetch = global.fetch;
        const fetchMock = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ token: "mock-jwt-token" }),
            })
        ) as any;

        beforeEach(() => {
            // Mock localStorage
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
                writable: true,
            });
            localStorageMock.clear();
            global.fetch = fetchMock;
            fetchMock.mockClear();
            vi.useFakeTimers();
        });

        afterEach(() => {
            global.fetch = globalFetch;
            vi.useRealTimers();
        });

        it('shows cookie consent popup after delay on first visit', async () => {
            render(<CookieConsent />);

            // Initially not visible
            expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument();

            // Advance timer past the 1500ms delay
            act(() => {
                vi.advanceTimersByTime(1600);
            });

            expect(screen.getByText('Cookie Consent')).toBeInTheDocument();
        });

        it('showing preferences when clicking Preferences button', async () => {
            render(<CookieConsent />);
            act(() => {
                vi.advanceTimersByTime(1600);
            });
            expect(screen.getByText('Cookie Consent')).toBeInTheDocument();

            const preferencesBtn = screen.getByRole('button', { name: /Preferences/i });
            fireEvent.click(preferencesBtn);

            expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
            expect(screen.getByText('Strictly Necessary')).toBeInTheDocument();
            expect(screen.getByText('Analytics')).toBeInTheDocument();
            expect(screen.getByText('Marketing')).toBeInTheDocument();
        });

        it('hides popup and sets localStorage when Accept All is clicked', async () => {
            render(<CookieConsent />);

            // Advance timer to show popup
            act(() => {
                vi.advanceTimersByTime(1600);
            });
            expect(screen.getByText('Cookie Consent')).toBeInTheDocument();

            // Click Accept All button
            const acceptBtn = screen.getByRole('button', { name: /Accept All/i });
            await act(async () => {
                fireEvent.click(acceptBtn);
            });

            expect(fetchMock).toHaveBeenCalledWith("/api/cookie-consent", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ analytics: true, marketing: true })
            }));

            // Check localStorage was set
            expect(localStorage.getItem('startit-cookie-consent')).toBe('accepted');
            expect(localStorage.getItem('startit-cookie-consent-jwt')).toBe('mock-jwt-token');
        });

        it('saves custom preferences', async () => {
            render(<CookieConsent />);
            act(() => {
                vi.advanceTimersByTime(1600);
            });
            expect(screen.getByText('Cookie Consent')).toBeInTheDocument();

            // Go to preferences
            fireEvent.click(screen.getByRole('button', { name: /Preferences/i }));

            const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            expect(fetchMock).toHaveBeenCalledWith("/api/cookie-consent", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ analytics: true, marketing: false })
            }));

            expect(localStorage.getItem('startit-cookie-consent')).toBe('accepted');
        });

        it('does not show popup if user has already consented', async () => {
            // Set consent in localStorage
            localStorage.setItem('startit-cookie-consent', 'accepted');

            render(<CookieConsent />);

            // Advance timer
            act(() => {
                vi.advanceTimersByTime(1600);
            });

            // Popup should not appear
            expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument();
        });
    });
});
