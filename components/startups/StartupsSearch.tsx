"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function StartupsSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search");
    const [isPending, startTransition] = useTransition();

    const handleClear = () => {
        startTransition(() => {
            router.push("/dashboard/startups");
            router.refresh();
        });
    };

    if (!searchQuery) return null;

    return (
        <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
        >
            <X className="w-4 h-4" />
            {isPending ? "Clearing..." : `Clear Search: "${searchQuery}"`}
        </button>
    );
}
