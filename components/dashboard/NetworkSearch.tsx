"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Search } from "lucide-react";
import { useState, useTransition } from "react";

interface NetworkSearchProps {
    initialSearch?: string;
}

export function NetworkSearch({ initialSearch }: NetworkSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(initialSearch || "");
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            if (searchValue.trim()) {
                router.push(`/dashboard/network?search=${encodeURIComponent(searchValue.trim())}`);
            } else {
                router.push("/dashboard/network");
            }
        });
    };

    const handleClear = () => {
        setSearchValue("");
        startTransition(() => {
            router.push("/dashboard/network");
        });
    };

    return (
        <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search by name or skill..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
            </form>
            {initialSearch && (
                <button
                    onClick={handleClear}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                    Clear: "{initialSearch}"
                </button>
            )}
        </div>
    );
}
