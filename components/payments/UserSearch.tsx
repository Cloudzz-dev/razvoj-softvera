"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Check, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";

interface UserSearchProps {
    onSelect: (user: any) => void;
    selectedUserId?: string;
}

export function UserSearch({ onSelect, selectedUserId }: UserSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Custom debounce hook used in the project
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        async function searchUsers() {
            if (!debouncedQuery) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/network?search=${encodeURIComponent(debouncedQuery)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    // Fix: API returns { items: [], nextCursor: ... }, not just []
                    setUsers(Array.isArray(data) ? data : (data.items || []));
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }

        searchUsers();
    }, [debouncedQuery]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const clearSearch = () => {
        setQuery("");
        setUsers([]);
        setOpen(false);
        onSelect(null); // Optional: clear selection if desired behavior
    };

    return (
        <div ref={containerRef} className="relative w-full group">
            {/* Input Container with animated glow border */}
            <div className={`
                relative flex items-center transition-all duration-300
                rounded-full bg-white/5 border border-white/10
                focus-within:bg-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50
                group-hover:border-white/20
            `}>
                <div className="pl-4 text-zinc-400 group-focus-within:text-indigo-400 transition-colors">
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5" />
                    )}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => {
                        if (query.length > 0) setOpen(true);
                    }}
                    placeholder="Search users by name or email..."
                    className="w-full bg-transparent border-none py-4 px-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-0 text-base"
                />

                {query.length > 0 && (
                    <button
                        onClick={clearSearch}
                        className="pr-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Floating Glass Dropdown */}
            <AnimatePresence>
                {open && (users.length > 0 || loading || (query.length > 0 && users.length === 0 && !loading)) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl ring-1 ring-black/5"
                    >
                        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {users.length === 0 && !loading ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <div className="p-3 rounded-full bg-white/5">
                                        <Search className="h-6 w-6 text-zinc-500" />
                                    </div>
                                    <p className="text-sm text-zinc-400">No users found used "{query}"</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Suggested Users
                                    </div>
                                    {users.map((user) => (
                                        <motion.button
                                            key={user.id}
                                            layout
                                            onClick={() => {
                                                onSelect(user);
                                                setQuery(user.name || user.email);
                                                setOpen(false);
                                            }}
                                            className={`
                                                w-full flex items-center gap-4 rounded-2xl px-3 py-3 text-sm transition-all
                                                hover:bg-white/10 group/item relative overflow-hidden
                                                ${selectedUserId === user.id ? "bg-indigo-500/20 border border-indigo-500/30" : "transparent"}
                                            `}
                                        >
                                            {/* Selection Indicator Background */}
                                            {selectedUserId === user.id && (
                                                <motion.div
                                                    layoutId="selection"
                                                    className="absolute inset-0 bg-indigo-500/10"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}

                                            <div className="relative">
                                                <Avatar
                                                    name={user.name || user.email}
                                                    role={user.role}
                                                    size="md"
                                                    className="ring-1 ring-white/10 group-hover/item:ring-white/30 transition-all"
                                                />
                                            </div>

                                            <div className="flex flex-col items-start flex-1 min-w-0">
                                                <span className={`font-medium truncate transition-colors ${selectedUserId === user.id ? "text-indigo-200" : "text-zinc-200 group-hover/item:text-white"}`}>
                                                    {user.name}
                                                </span>
                                                <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                                            </div>

                                            {selectedUserId === user.id && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="p-1 rounded-full bg-indigo-500"
                                                >
                                                    <Check className="h-3 w-3 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
