import { describe, it, expect } from 'vitest';
import {
    calculatePostMoney,
    calculateInvestorOwnership,
    calculateSharePrice,
    calculateNewShares,
    BPS_SCALE
} from '../../../lib/math/dilution';

describe('Equity Math Logic', () => {

    it('calculates post-money valuation correctly', () => {
        expect(calculatePostMoney(4000000, 1000000)).toBe(5000000);
    });

    it('calculates investor ownership correctly (Simple)', () => {
        // 1M investment on 4M pre (5M post) = 20%
        const ownership = calculateInvestorOwnership(1000000, 5000000);
        expect(ownership).toBe(2000); // 20.00% in bps
    });

    it('calculates investor ownership correctly (Complex)', () => {
        // 500k investment on 5M pre (5.5M post) = 9.09%
        const ownership = calculateInvestorOwnership(500000, 5500000);
        expect(ownership).toBe(909); // 9.09% in bps
    });

    it('calculates share price correctly', () => {
        // 4M pre / 1M shares = $4.00/share
        expect(calculateSharePrice(4000000, 1000000)).toBe(4);
    });

    it('calculates new shares to issue correctly', () => {
        // 1M investment / $4.00 per share = 250,000 new shares
        expect(calculateNewShares(1000000, 4)).toBe(250000);
    });

    it('handles edge case: zero pre-money val', () => {
        expect(calculatePostMoney(0, 100)).toBe(100);
    });

    it('handles edge case: negative values throw error', () => {
        expect(() => calculatePostMoney(-100, 100)).toThrow();
    });

    it('handles division by zero in share price', () => {
        expect(calculateSharePrice(100, 0)).toBe(0);
    });
});
