// Payment utility functions for transaction processing

export const SERVICE_FEE_PERCENTAGE = 2.5; // 2.5% service fee

export interface PaymentCalculation {
    amount: number;
    serviceFee: number;
    netAmount: number;
    currency: string;
}

/**
 * Calculate service fee and net amount for a transaction
 */
export function calculatePayment(amount: number, currency: string = "USD"): PaymentCalculation {
    const serviceFee = (amount * SERVICE_FEE_PERCENTAGE) / 100;
    const netAmount = amount - serviceFee;

    return {
        amount,
        serviceFee: parseFloat(serviceFee.toFixed(2)),
        netAmount: parseFloat(netAmount.toFixed(2)),
        currency,
    };
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
}

/**
 * Get payment provider display name
 */
export function getProviderName(provider: string): string {
    const providers: Record<string, string> = {
        PAYPAL: "PayPal",
        CRYPTO: "Crypto Wallet",
        CARD: "Credit/Debit Card",
    };
    return providers[provider] || provider;
}

/**
 * Get payment provider icon
 */
export function getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
        PAYPAL: "💳",
        CRYPTO: "₿",
        CARD: "💰",
    };
    return icons[provider] || "💵";
}

/**
 * Get transaction status color
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        PENDING: "yellow",
        COMPLETED: "green",
        FAILED: "red",
        CANCELLED: "gray",
    };
    return colors[status] || "gray";
}

/**
 * Get transaction status display text
 */
export function getStatusText(status: string): string {
    const texts: Record<string, string> = {
        PENDING: "Pending",
        COMPLETED: "Completed",
        FAILED: "Failed",
        CANCELLED: "Cancelled",
    };
    return texts[status] || status;
}
