import { describe, it, expect } from 'vitest';
import {
    calculatePayment,
    formatCurrency,

    getProviderName,
    getStatusColor
} from '@/lib/payment-utils';

describe('lib/payment-utils', () => {
    describe('calculatePayment', () => {
        it('should calculate correct fee and net amount', () => {
            const result = calculatePayment(100);
            expect(result.amount).toBe(100);
            expect(result.serviceFee).toBe(2.5);
            expect(result.netAmount).toBe(97.5);
        });

        it('should handle rounding correctly', () => {
            const result = calculatePayment(33.33);
            expect(result.serviceFee).toBe(0.83); // 2.5% of 33.33 = 0.83325
            expect(result.netAmount).toBe(32.5); // 33.33 - 0.83 = 32.5
        });
    });

    describe('formatCurrency', () => {
        it('should format USD correctly', () => {
            expect(formatCurrency(100)).toContain('$100.00');
        });
    });

    describe('status and provider helpers', () => {
        it('should return correct provider names', () => {
            expect(getProviderName('PAYPAL')).toBe('PayPal');
            expect(getProviderName('UNKNOWN')).toBe('UNKNOWN');
        });

        it('should return correct status colors', () => {
            expect(getStatusColor('COMPLETED')).toBe('green');
            expect(getStatusColor('UNKNOWN')).toBe('gray');
        });
    });
});
