import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthButton } from '@/components/auth/AuthButton';

describe('Auth Components', () => {
    describe('AuthButton', () => {
        it('renders children correctly', () => {
            render(<AuthButton>Login</AuthButton>);
            const link = screen.getByRole('link', { name: 'Login' });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', '/dashboard');
        });

        it('renders icon if provided', () => {
            render(<AuthButton icon={<span data-testid="icon">Icon</span>}>Login</AuthButton>);
            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });
    });
});
