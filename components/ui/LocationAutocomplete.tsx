"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationSuggestion {
    place_id: number;
    display_name: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
}

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Location autocomplete component using internal API proxy to Nominatim
 */
export function LocationAutocomplete({
    value,
    onChange,
    placeholder = "e.g. San Francisco, CA",
    className = "",
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync external value changes
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    const searchLocations = useCallback(async (searchQuery: string) => {
        setSuggestions([]); // Clear previous suggestions immediately

        if (searchQuery.length < 2) {
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        try {
            // Use internal proxy to avoid CORS and User-Agent issues
            const response = await fetch(
                `/api/locations?q=${encodeURIComponent(searchQuery)}`,
                {
                    signal: abortControllerRef.current.signal,
                }
            );

            if (!response.ok) {
                throw new Error("Search failed");
            }

            const data = await response.json();
            setSuggestions(data);
            setIsOpen(true);
            setHighlightedIndex(-1);
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                console.error("Location search error:", error);
                // Keep suggestions empty on error
                setSuggestions([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce timer
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== value) {
                searchLocations(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchLocations, value]);

    // Format location for display
    const formatLocation = (suggestion: LocationSuggestion): string => {
        const addr = suggestion.address;
        const city = addr.city || addr.town || addr.village;
        const parts = [city, addr.state, addr.country].filter(Boolean);
        return parts.join(", ") || suggestion.display_name.split(",").slice(0, 3).join(",");
    };

    // Handle selection
    const handleSelect = (suggestion: LocationSuggestion) => {
        const formatted = formatLocation(suggestion);
        setQuery(formatted);
        onChange(formatted);
        setIsOpen(false);
        setSuggestions([]);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    handleSelect(suggestions[highlightedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    // Clear input
    const handleClear = () => {
        setQuery("");
        onChange("");
        setSuggestions([]);
        inputRef.current?.focus();
    };

    return (
        <div ref={wrapperRef} className={`relative block ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-30" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2 && suggestions.length > 0) setIsOpen(true);
                        else if (query.length >= 2) searchLocations(query);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-10 pr-10 py-6"
                />
                {isLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
                ) : query ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white z-30"
                    >
                        <X className="w-4 h-4" />
                    </button>
                ) : null}
            </div>

            {/* Suggestions dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[9999] w-full mt-1 p-1 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => handleSelect(suggestion)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors rounded-2xl ${index === highlightedIndex
                                    ? "bg-indigo-600 text-white"
                                    : "text-zinc-300 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 flex-shrink-0 text-zinc-500" />
                                <span className="truncate">{formatLocation(suggestion)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {isOpen && !isLoading && query.length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-[9999] w-full mt-1 py-3 px-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl text-sm text-zinc-400 text-center shadow-xl">
                    No locations found
                </div>
            )}
        </div>
    );
}
