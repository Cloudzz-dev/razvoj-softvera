"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <Button
            variant="ghost"
            onClick={handleClear}
            className="p-0 h-auto hover:bg-transparent"
        >
            <Badge variant="outline" className="flex items-center gap-2 cursor-pointer group-hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
                {isPending ? "Clearing..." : `Clear Search: "${searchQuery}"`}
            </Badge>
        </Button>
    );
}
