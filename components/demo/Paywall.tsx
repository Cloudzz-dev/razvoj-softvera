"use client";

import { useState } from "react";
import { Loader2, Lock, Unlock } from "lucide-react";
import { parseEther } from "viem";

export default function Paywall() {
    const [loading, setLoading] = useState(false);
    const [unlockedData, setUnlockedData] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handlePay = async () => {
        setLoading(true);
        setError("");

        try {
            if (!window.ethereum) {
                throw new Error("No crypto wallet found. Please install Coinbase Wallet or MetaMask.");
            }

            // 1. Check the 402 endpoint to get price/address headers
            const checkReq = await fetch("/api/pay/402");
            if (checkReq.status !== 402) {
                throw new Error("Content is not premium?");
            }

            const recipient = checkReq.headers.get("x-402-address");
            const amount = checkReq.headers.get("x-402-amount");

            if (!recipient || !amount) throw new Error("Missing payment info from server");

            // 2. Request Transaction
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const account = accounts[0];

            // Send ETH (Base Sepolia)
            // Note: In production you'd switch chain here programmatically
            const txHash = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [
                    {
                        from: account,
                        to: recipient,
                        value: parseEther(amount).toString(16), // Convert to Hex
                    },
                ],
            });

            // 3. Verify Payment
            const verifyReq = await fetch("/api/pay/402", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash }),
            });

            const result = await verifyReq.json();

            if (result.success) {
                setUnlockedData(result.data.secret_message);
            } else {
                throw new Error(result.error || "Verification failed");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    if (unlockedData) {
        return (
            <div className="p-6 bg-green-50 border border-green-200 rounded-3xl">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Unlock className="w-5 h-5" />
                    <h3 className="font-semibold">Content Unlocked</h3>
                </div>
                <p className="text-green-900">{unlockedData}</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 border border-gray-700 rounded-3xl max-w-md">
            <div className="flex items-center gap-2 text-white mb-4">
                <Lock className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Premium Content</h3>
            </div>
            <p className="text-gray-400 mb-6">
                Pay 0.01 ETH (Base Sepolia) to unlock this special content directly on-chain.
            </p>

            {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

            <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Now (0.01 ETH)"}
            </button>
        </div>
    );
}
