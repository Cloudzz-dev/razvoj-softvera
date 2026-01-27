"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getProviderIcon, getStatusColor, getStatusText } from "@/lib/payment-utils";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

type TransactionFilter = "all" | "sent" | "received";

interface Transaction {
    id: string;
    sender: {
        name: string | null;
        email: string;
        image: string | null;
    };
    senderId: string;
    receiver: {
        name: string | null;
        email: string;
        image: string | null;
    };
    receiverId: string;
    amount: number;
    serviceFee: number;
    netAmount: number;
    status: "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED";
    createdAt: string;
    description: string | null;
    provider: "PAYPAL" | "CRYPTO" | "CARD";
}

export function TransactionHistory() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [filter, setFilter] = useState<TransactionFilter>("all");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = useCallback(async (currentFilter: TransactionFilter) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/transactions?filter=${currentFilter}`);
            if (!response.ok) throw new Error("Failed to fetch transactions");
            const data = await response.json();
            // Handle both paginated response { transactions: [] } and legacy array response
            setTransactions(Array.isArray(data) ? data : data.transactions || []);
        } catch (error) {
            console.error(error);
            toast.error("Could not load transaction history.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions(filter);

        const handleTransactionCompleted = () => {
            fetchTransactions(filter);
        };

        window.addEventListener("transaction-completed", handleTransactionCompleted);
        return () => {
            window.removeEventListener("transaction-completed", handleTransactionCompleted);
        };
    }, [filter, fetchTransactions]);

    const handleFilterChange = useCallback((newFilter: TransactionFilter) => {
        setFilter(newFilter);
    }, []);

    return (
        <GlassCard variant="medium" className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Transaction History</h2>
                <div className="flex gap-2">
                    {(["all", "sent", "received"] as TransactionFilter[]).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "glass"}
                            size="sm"
                            onClick={() => handleFilterChange(f)}
                            className="rounded-full"
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-12 text-zinc-500">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">No transactions found.</div>
                ) : (
                    transactions.map((tx) => {
                        const isSent = tx.senderId === userId;
                        const statusColor = getStatusColor(tx.status);

                        return (
                            <div key={tx.id} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`p-2 rounded-2xl ${isSent ? "bg-red-500/10" : "bg-green-500/10"}`}>
                                            {isSent ? <ArrowUpRight className="w-5 h-5 text-red-400" /> : <ArrowDownLeft className="w-5 h-5 text-green-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-white">
                                                    {isSent
                                                        ? `To ${tx.receiver.name || tx.receiver.email}`
                                                        : `From ${tx.sender.name || tx.sender.email}`
                                                    }
                                                </p>
                                                <Badge variant={statusColor as any}>
                                                    {getStatusText(tx.status)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-2">{tx.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span>{format(new Date(tx.createdAt), "MMM dd, yyyy")}</span>
                                                <span>{getProviderIcon(tx.provider)} {tx.provider}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${isSent ? "text-red-400" : "text-green-400"}`}>
                                            {isSent ? "-" : "+"}{formatCurrency(isSent ? tx.amount : tx.netAmount)}
                                        </p>
                                        {tx.serviceFee > 0 && <p className="text-xs text-zinc-500 mt-1">Fee: {formatCurrency(tx.serviceFee)}</p>}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="grid grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <p className="text-zinc-500 mb-1">Gross Amount</p>
                                            <p className="text-white font-medium">{formatCurrency(tx.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">Service Fee</p>
                                            <p className="text-yellow-400 font-medium">{formatCurrency(tx.serviceFee)}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">Net Amount</p>
                                            <p className="text-green-400 font-medium">{formatCurrency(tx.netAmount)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </GlassCard>
    );
}
