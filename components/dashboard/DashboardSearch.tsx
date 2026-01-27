"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = {
    "/dashboard/network": {
        title: "Skills",
        options: ["React", "Node.js", "Python", "TypeScript", "AWS", "Docker"]
    },
    "/dashboard/startups": {
        title: "Stage",
        options: ["Pre-seed", "Seed", "Series A", "Series B"]
    },
    "/dashboard/investors": {
        title: "Focus",
        options: ["AI & ML", "SaaS", "Climate Tech", "Fintech", "Health"]
    }
};

export function DashboardSearch() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(searchParams.get("search") || "");

    // Update query state when URL changes
    useEffect(() => {
        setQuery(searchParams.get("search") || "");
    }, [searchParams]);

    const handleSearch = (term: string) => {
        setQuery(term);
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const toggleFilter = (option: string) => {
        // For simplicity, clicking a filter just sets it as the search term
        // In a more complex app, this would handle multiple filters
        handleSearch(option);
    };

    const currentFilters = FILTER_OPTIONS[pathname as keyof typeof FILTER_OPTIONS];

    if (!currentFilters && pathname !== "/dashboard") return null;

    return (
        <div className="relative max-w-md w-full">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={currentFilters ? `Search by ${currentFilters.title.toLowerCase()}...` : "Search dashboard..."}
                    className="pl-10 pr-10"
                />
                {currentFilters && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-white transition-colors",
                            isOpen ? "text-indigo-400" : "text-zinc-400"
                        )}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Filter Dropdown */}
            {isOpen && currentFilters && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-3xl bg-black/80 border border-white/10 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-400">Filter by {currentFilters.title}</span>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {currentFilters.options.map((option) => (
                            <button
                                key={option}
                                onClick={() => toggleFilter(option)}
                                className="transition-all"
                            >
                                <Badge
                                    variant={query === option ? "indigo" : "outline"}
                                    className={cn(
                                        "cursor-pointer",
                                        query !== option && "hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {option}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
