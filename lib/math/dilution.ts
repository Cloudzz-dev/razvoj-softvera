/**
 * Equity Dilution Calculator
 * Uses integer math (safe-math) where possible to avoid floating point errors.
 * 
 * definitions:
 * - Basis Points (bps): 100% = 10000 bps. 1% = 100 bps. 0.01% = 1 bps.
 * - Cents: $1.00 = 100 cents.
 */

export const BPS_SCALE = 10000;

/**
 * Calculate Post-Money Valuation
 * Post-Money = Pre-Money + Investment
 */
export function calculatePostMoney(preMoney: number, investment: number): number {
    if (preMoney < 0 || investment < 0) throw new Error("Values cannot be negative");
    return preMoney + investment;
}

/**
 * Calculate Investors Ownership Percentage (in BPS)
 * Ownership = Investment / Post-Money
 */
export function calculateInvestorOwnership(investment: number, postMoney: number): number {
    if (postMoney === 0) return 0;
    // (Investment * 10000) / PostMoney
    return Math.round((investment * BPS_SCALE) / postMoney);
}

/**
 * Calculate New Share Price
 * Price = Pre-Money / Fully Diluted Shares (Pre-Investment)
 */
export function calculateSharePrice(preMoney: number, preMoneyShares: number): number {
    if (preMoneyShares === 0) return 0;
    return preMoney / preMoneyShares;
}

/**
 * Calculate New Shares to Issue
 * New Shares = Investment / Share Price
 */
export function calculateNewShares(investment: number, sharePrice: number): number {
    if (sharePrice === 0) return 0;
    return Math.round(investment / sharePrice);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatPercentage(bps: number): string {
    return (bps / 100).toFixed(2) + "%";
}
