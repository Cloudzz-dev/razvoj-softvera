"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { X, Wallet, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupOption } from "@/components/ui/radio-group";
import Image from "next/image";

interface PaymentRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (proof: string) => void;
    metadata: {
        price: string;
        currency: string;
        reason: string;
    } | null;
}

export function PaymentRequiredModal({ isOpen, onClose, onSuccess, metadata }: PaymentRequiredModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<"crypto" | "card">("crypto");

    if (!isOpen || !metadata) return null;

    const handlePay = async () => {
        setIsProcessing(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessing(false);
        onSuccess(`proof_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-md relative overflow-hidden border-indigo-500/50 shadow-2xl shadow-indigo-500/20 rounded-3xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-6 text-center border-b border-white/10 bg-indigo-500/10">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-500/50">
                        <ShieldCheck className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Premium Contact</h2>
                    <Badge variant="indigo" className="bg-indigo-500/20 border-indigo-500/30">
                        {metadata.reason}
                    </Badge>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center justify-center py-4">
                        <span className="text-4xl font-bold text-white tracking-tight">
                            ${metadata.price}
                        </span>
                        <span className="text-sm text-zinc-400 mt-1 uppercase tracking-wider font-medium">
                            {metadata.currency} Deposit
                        </span>
                    </div>

                    {/* Payment Methods */}
                    <RadioGroup value={selectedMethod} onChange={setSelectedMethod} className="grid grid-cols-2 gap-3">
                        <RadioGroupOption
                            value="crypto"
                            className="flex flex-col items-center justify-center p-4 rounded-2xl"
                        >
                            <Wallet className="w-6 h-6 mb-2" />
                            <span className="text-xs font-medium">Crypto (Base)</span>
                        </RadioGroupOption>

                        <RadioGroupOption
                            value="card"
                            className="flex flex-col items-center justify-center p-4 rounded-2xl"
                        >
                            <CreditCard className="w-6 h-6 mb-2" />
                            <span className="text-xs font-medium">Card</span>
                        </RadioGroupOption>
                    </RadioGroup>

                    {/* Dynamic Content based on method */}
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-xs text-zinc-400">
                        {selectedMethod === "crypto" ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                    <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current">
                                        <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm7.994-15.781L16.498 4 9 16.22l7.498 4.353 7.496-4.354zM24 17.616l-7.502 4.351L9 17.617l7.498 10.378L24 17.616z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-medium">Pay with Ethereum</p>
                                    <p>Network: Base Sepolia</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="w-6 h-auto" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Visa ending in 4242</p>
                                    <p>Expires 12/28</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay $${metadata.price}`
                        )}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
