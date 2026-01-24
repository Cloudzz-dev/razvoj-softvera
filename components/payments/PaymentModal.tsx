"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { X, CreditCard, Wallet, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/payment-utils";
import toast from "react-hot-toast";
import posthog from "posthog-js";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientId: string;
}

type PaymentProvider = "PAYPAL" | "CRYPTO" | "CARD";

interface PaymentDetails {
    amount: number;
    serviceFee: number;
    netAmount: number;
}

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function PaymentModal({ isOpen, onClose, recipientName, recipientId }: PaymentModalProps) {
    const [amount, setAmount] = useState("");
    const debouncedAmount = useDebounce(amount, 500);
    const [provider, setProvider] = useState<PaymentProvider>("CARD");
    const [description, setDescription] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        const calculateFees = async () => {
            const numericAmount = parseFloat(debouncedAmount);
            if (numericAmount > 0) {
                setIsCalculating(true);
                try {
                    const response = await fetch("/api/payments/calculate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount: numericAmount }),
                    });
                    if (!response.ok) throw new Error("Fee calculation failed");
                    const data = await response.json();
                    setPaymentDetails(data);
                } catch (error) {
                    console.error(error);
                    toast.error("Could not calculate fees.");
                    setPaymentDetails(null);
                } finally {
                    setIsCalculating(false);
                }
            } else {
                setPaymentDetails(null);
            }
        };
        calculateFees();
    }, [debouncedAmount]);

    if (!isOpen) return null;

    const providers: { id: PaymentProvider; name: string; icon: any; description: string }[] = [
        { id: "CARD", name: "Credit/Debit Card", icon: CreditCard, description: "Instant payment via card" },
        { id: "CRYPTO", name: "Crypto Wallet", icon: Wallet, description: "Pay with cryptocurrency" },
        { id: "PAYPAL", name: "PayPal", icon: Smartphone, description: "Pay with PayPal account" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentDetails || isCalculating) return;

        setIsProcessing(true);
        try {
            const response = await fetch("/api/payments/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: paymentDetails.amount,
                    recipientId,
                    recipientName,
                    description,
                    provider,
                    idempotencyKey: `pay_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`, // ✅ FIX: Added required field
                }),
            });

            if (!response.ok) throw new Error("Payment failed");

            // Track successful payment
            posthog.capture("payment_sent", {
                amount: paymentDetails.amount,
                service_fee: paymentDetails.serviceFee,
                net_amount: paymentDetails.netAmount,
                payment_provider: provider,
                has_description: !!description,
            });

            toast.success(`Payment of ${formatCurrency(paymentDetails.amount)} sent to ${recipientName}!`);
            onClose();
            setAmount("");
            setDescription("");
            setPaymentDetails(null);

            // Trigger a refresh of the transaction history if possible
            // Since we're using SWR or simple fetch in the parent, we might need to reload or rely on the user navigating back
            // For now, we'll just close the modal. The history page will fetch the new list when visited.
            window.dispatchEvent(new Event("transaction-completed"));
        } catch (error) {
            console.error(error);
            // Capture payment error
            posthog.captureException(error instanceof Error ? error : new Error("Payment failed"));
            toast.error("Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard variant="dark" className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Send Payment</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-zinc-400 mb-1">Sending to</p>
                        <p className="text-lg font-semibold text-white">{recipientName}</p>
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-2">Amount (USD)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full pl-8 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {isCalculating && <div className="text-sm text-zinc-400 text-center">Calculating fees...</div>}

                    {paymentDetails && !isCalculating && (
                        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-white/10 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Amount</span>
                                <span className="text-white font-medium">{formatCurrency(paymentDetails.amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Service Fee</span>
                                <span className="text-yellow-400 font-medium">-{formatCurrency(paymentDetails.serviceFee)}</span>
                            </div>
                            <div className="pt-2 border-t border-white/10 flex justify-between">
                                <span className="text-white font-semibold">Recipient Receives</span>
                                <span className="text-green-400 font-bold text-lg">{formatCurrency(paymentDetails.netAmount)}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setProvider(p.id)}
                                    className={`p-4 rounded-lg border transition-all ${provider === p.id ? "bg-white/10 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                                >
                                    <p.icon className={`w-6 h-6 mx-auto mb-2 ${provider === p.id ? "text-indigo-400" : "text-zinc-400"}`} />
                                    <p className={`text-xs font-medium text-center ${provider === p.id ? "text-white" : "text-zinc-400"}`}>{p.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">Description (Optional)</label>
                        <input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="What's this payment for?"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing || isCalculating || !paymentDetails}
                        className="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? "Processing..." : `Send ${paymentDetails ? formatCurrency(paymentDetails.amount) : "Payment"}`}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
}
