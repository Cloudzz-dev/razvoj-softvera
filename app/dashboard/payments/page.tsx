"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PaymentModal } from "@/components/payments/PaymentModal";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { GlassCard } from "@/components/ui/GlassCard";
import { Send, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/payment-utils";

import { UserSearch } from "@/components/payments/UserSearch";

export default function PaymentsPage() {
    const { data: session } = useSession();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    // Users state no longer needed for full list
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [txRes] = await Promise.all([
                    fetch("/api/transactions"),
                ]);

                if (txRes.ok) {
                    const data = await txRes.json();
                    setTransactions(data);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        }
        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const totalSent = transactions
        .filter((tx) => tx.senderId === session?.user?.id)
        .reduce((sum, tx) => sum + tx.amount, 0);

    const totalReceived = transactions
        .filter(
            (tx) =>
                tx.receiverId === session?.user?.id &&
                tx.status === "COMPLETED"
        )
        .reduce((sum, tx) => sum + tx.netAmount, 0);

    const totalFees = transactions
        .filter((tx) => tx.status === "COMPLETED")
        .reduce((sum, tx) => sum + (tx.serviceFee || 0), 0);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div>
                    <div className="h-8 w-48 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-64 bg-white/5 rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                    ))}
                </div>
                <div className="h-96 bg-white/5 rounded-xl border border-white/10" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Payments</h1>
                <p className="text-zinc-400">Manage your transactions and payments</p>
            </div>

            {/* Coming Soon Banner */}
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-amber-200 font-medium">🚧 Payment Processing Coming Soon</p>
                        <p className="text-amber-300/70 text-sm">Live payment integration is under development. You can view your transaction history below.</p>
                    </div>
                    <span className="ml-auto px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Beta
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-red-500/10">
                            <ArrowUpRight className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(totalSent)}</p>
                    <p className="text-sm text-zinc-400">Total Sent</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <ArrowDownLeft className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(totalReceived)}</p>
                    <p className="text-sm text-zinc-400">Total Received</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <DollarSign className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(totalFees)}</p>
                    <p className="text-sm text-zinc-400">Platform Fees (2.5%)</p>
                </GlassCard>

                <GlassCard className="p-6 border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3">
                    <div className="w-full">
                        <UserSearch
                            onSelect={(user) => setSelectedUser(user)}
                            selectedUserId={selectedUser?.id}
                        />
                    </div>
                    {selectedUser && (
                        <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10 w-full">
                            <div className="flex-1 text-sm text-white truncate text-center">
                                paying <span className="font-bold">{selectedUser.name}</span>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-zinc-400 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={!selectedUser}
                        className="w-full px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        Send Payment
                    </button>
                </GlassCard>
            </div>

            {/* Transaction History */}
            <TransactionHistory />

            {/* Payment Modal */}
            {selectedUser && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    recipientName={selectedUser.name}
                    recipientId={selectedUser.id}
                />
            )}
        </div>
    );
}
