"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, Copy, Check, X, Bitcoin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type CryptoOption = "BTC" | "ETH" | "BASE";

const CRYPTO_OPTIONS: Record<CryptoOption, { label: string; address: string; icon: string }> = {
    BTC: {
        label: "Bitcoin",
        address: "bc1qagr2u56p8rejsg3wsl0pqexgl55zy2w78vxgqg",
        icon: "₿"
    },
    ETH: {
        label: "Ethereum",
        address: "0x0ecafd5319ab550bfee144af2618ef8cb9434a45",
        icon: "Ξ"
    },
    BASE: {
        label: "Base",
        address: "0x0ecafd5319ab550bfee144af2618ef8cb9434a45",
        icon: "🔵"
    }
};

export default function DonateButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedChain, setSelectedChain] = useState<CryptoOption>("ETH");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(CRYPTO_OPTIONS[selectedChain].address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-500 bg-pink-50/10 hover:bg-pink-50/20 border border-pink-500/30 rounded-full transition-all"
            >
                <Heart className="w-4 h-4 fill-current" />
                <span>Support Us</span>
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6"
                            >
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Close donation popup"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                                        <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">Support the Team</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        We're a small, independent team building this platform with passion.
                                        Every contribution helps us keep the lights on and ship new features faster.
                                    </p>

                                    {/* Tabs */}
                                    <div className="flex p-1 bg-gray-950 rounded-2xl border border-gray-800 mb-4 w-full">
                                        {(Object.keys(CRYPTO_OPTIONS) as CryptoOption[]).map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setSelectedChain(option);
                                                    setCopied(false);
                                                }}
                                                className={cn(
                                                    "flex-1 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5",
                                                    selectedChain === option
                                                        ? "bg-gray-800 text-white shadow-sm"
                                                        : "text-gray-500 hover:text-gray-300"
                                                )}
                                            >
                                                <span>{CRYPTO_OPTIONS[option].icon}</span>
                                                {CRYPTO_OPTIONS[option].label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="w-full bg-gray-950 rounded-2xl p-4 border border-gray-800">
                                        <label className="text-xs text-gray-500 uppercase tracking-tighter font-semibold mb-2 block text-left">
                                            Donate via {CRYPTO_OPTIONS[selectedChain].label}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-gray-900 p-2 rounded-xl text-xs text-gray-300 font-mono overflow-hidden text-ellipsis text-left">
                                                {CRYPTO_OPTIONS[selectedChain].address}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                                                title="Copy Address"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 text-xs text-gray-500">
                                        Thank you for your support!
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
