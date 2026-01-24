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
                    // Handle both paginated and non-paginated responses for backward compatibility
                    setTransactions(Array.isArray(data) ? data : data.transactions || []);
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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

            {/* Quick Send Section - Expanded Layout */}
            <div className="relative z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10" />
                <GlassCard className="p-8 border-white/10 bg-black/60 relative overflow-visible">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 w-full space-y-2">
                            <h2 className="text-xl font-semibold text-white">Send Payment</h2>
                            <p className="text-zinc-400 text-sm">Search for a user by name or email to initiate a secure transfer.</p>
                            <div className="pt-2 max-w-xl">
                                <UserSearch
                                    onSelect={(user) => setSelectedUser(user)}
                                    selectedUserId={selectedUser?.id}
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-3 min-w-[200px]">
                            {selectedUser && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full animate-in fade-in slide-in-from-right-4">
                                    <div className="text-xs text-zinc-400 mb-1">Recipient</div>
                                    <div className="font-medium text-white">{selectedUser.name}</div>
                                    <div className="text-xs text-zinc-500">{selectedUser.email}</div>
                                </div>
                            )}
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                disabled={!selectedUser}
                                className="w-full px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                            >
                                <Send className="w-4 h-4" />
                                Proceed to Pay
                            </button>
                        </div>
                    </div>
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
