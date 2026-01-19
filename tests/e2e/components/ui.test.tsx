import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Avatar, FemaleAvatar, MaleAvatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { DynamicIsland } from '@/components/ui/DynamicIsland';
import { EnhancedBackground } from '@/components/ui/EnhancedBackground';
import { InfiniteMovingCards } from '@/components/ui/InfiniteMovingCards';
import { MetricsChart } from '@/components/ui/MetricsChart';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    User: () => <div data-testid="user-icon" />,
    Home: () => <div data-testid="home-icon" />,
    Briefcase: () => <div data-testid="briefcase-icon" />,
    Users: () => <div data-testid="users-icon" />,
    MessageSquare: () => <div data-testid="message-icon" />,
    Search: () => <div data-testid="search-icon" />,
    Layout: () => <div data-testid="layout-icon" />,
    Menu: () => <div data-testid="menu-icon" />,
    X: () => <div data-testid="x-icon" />,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
        button: ({ children, className, ...props }: any) => <button className={className} {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useReducedMotion: () => false,
}));

// Mock next/image
vi.mock('next/image', () => ({
    default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock Recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Area: () => <div data-testid="area" />,
    Line: () => <div data-testid="line" />,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
}));

describe('UI Components', () => {
    describe('Avatar', () => {
        it('renders initials correctly', () => {
            render(<Avatar name="John Doe" />);
            expect(screen.getByText('JD')).toBeInTheDocument();
        });

        it('renders User icon when name is empty', () => {
            render(<Avatar name="" />);
            expect(screen.getByTestId('user-icon')).toBeInTheDocument();
        });

        it('applies role-based colors', () => {
            const { container } = render(<Avatar name="Dev One" role="DEVELOPER" />);
            expect(container.firstChild).toHaveClass('from-blue-500');
            expect(container.firstChild).toHaveClass('to-cyan-500');
        });

        it('applies size classes', () => {
            const { container } = render(<Avatar name="Size Test" size="lg" />);
            expect(container.firstChild).toHaveClass('w-16');
            expect(container.firstChild).toHaveClass('h-16');
        });
    });

    describe('GenderAvatars', () => {
        it('renders female avatar', () => {
            const { container } = render(<FemaleAvatar />);
            expect(container.querySelector('svg')).toBeInTheDocument();
            expect(container.firstChild).toHaveClass('from-pink-500');
        });

        it('renders male avatar', () => {
            const { container } = render(<MaleAvatar />);
            expect(container.querySelector('svg')).toBeInTheDocument();
            expect(container.firstChild).toHaveClass('from-blue-500');
        });
    });

    describe('GlassCard', () => {
        it('renders children correctly', () => {
            render(<GlassCard>Test Content</GlassCard>);
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('applies hover effect class when enabled', () => {
            const { container } = render(<GlassCard hoverEffect>Content</GlassCard>);
            expect(container.firstChild).toHaveClass('hover:bg-white/10');
        });

        it('applies variant classes', () => {
            const { container } = render(<GlassCard variant="dark">Content</GlassCard>);
            expect(container.firstChild).toHaveClass('bg-black/60');
        });
    });

    describe('BentoGrid', () => {
        it('renders grid layout', () => {
            const { container } = render(
                <BentoGrid>
                    <div>Item 1</div>
                    <div>Item 2</div>
                </BentoGrid>
            );
            expect(container.firstChild).toHaveClass('grid');
            expect(container.firstChild).toHaveClass('md:grid-cols-3');
        });

        it('renders BentoGridItem with content', () => {
            render(
                <BentoGridItem
                    title="Test Title"
                    description="Test Description"
                    header={<div>Header</div>}
                    icon={<div data-testid="icon" />}
                />
            );
            expect(screen.getByText('Test Title')).toBeInTheDocument();
            expect(screen.getByText('Test Description')).toBeInTheDocument();
            expect(screen.getByText('Header')).toBeInTheDocument();
            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });
    });

    describe('BackgroundGrid', () => {
        it('renders without crashing', () => {
            const { container } = render(<BackgroundGrid />);
            // Component uses relative positioning, not fixed
            expect(container.firstChild).toHaveClass('relative');
            expect(container.firstChild).toHaveClass('w-full');
        });
    });

    describe('DynamicIsland', () => {
        it('renders initial state', () => {
            render(<DynamicIsland />);
            // Initial state shows the Menu button, DFDS.io appears on hover
            expect(screen.getByText('Menu')).toBeInTheDocument();
        });
    });

    describe('EnhancedBackground', () => {
        it('renders without crashing', () => {
            const { container } = render(<EnhancedBackground />);
            // Component uses grid-background class
            expect(container.firstChild).toHaveClass('grid-background');
        });
    });

    describe('InfiniteMovingCards', () => {
        const items = [
            { quote: 'Quote 1', name: 'Name 1', title: 'Title 1' },
            { quote: 'Quote 2', name: 'Name 2', title: 'Title 2' },
        ];

        it('renders items', () => {
            render(<InfiniteMovingCards items={items} />);
            // Items are duplicated for infinite scroll animation
            expect(screen.getAllByText('Quote 1').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('Name 1').length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('MetricsChart', () => {
        const data = [
            { date: 'Mon', value: 100 },
            { date: 'Tue', value: 200 },
        ];

        it('renders title', () => {
            render(<MetricsChart title="Test Metric" data={data} />);
            expect(screen.getByText('Test Metric')).toBeInTheDocument();
        });

        it('renders chart components', () => {
            // Default type is "line", so we should see line-chart
            render(<MetricsChart title="Test" data={data} />);
            expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });
});
