"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
                    <Input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search by name or skill..."
                        className="pl-10"
                    />
                </div>
            </form>
            {initialSearch && (
                <Button
                    variant="ghost"
                    onClick={handleClear}
                    disabled={isPending}
                    className="p-0 h-auto hover:bg-transparent"
                >
                    <Badge variant="outline" className="flex items-center gap-2 cursor-pointer group-hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4" />
                        Clear: "{initialSearch}"
                    </Badge>
                </Button>
            )}
        </div>
    );
}
