"use strict";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Search, Loader2, Check, User } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface UserSearchProps {
    onSelect: (user: any) => void;
    selectedUserId?: string;
}

export function UserSearch({ onSelect, selectedUserId }: UserSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
                // Ensure the API supports this query param
                const res = await fetch(`/api/network?search=${encodeURIComponent(debouncedQuery)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }

        searchUsers();
    }, [debouncedQuery]);

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    placeholder="Search by name or email..."
                    className="w-full rounded-lg bg-white/5 border border-white/10 py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-500"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-zinc-400" />
                )}
            </div>

            {open && (query.length > 0) && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl">
                    {users.length === 0 && !loading ? (
                        <div className="p-4 text-center text-sm text-zinc-500">No users found.</div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto p-1">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        onSelect(user);
                                        setQuery(user.name || user.email);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5 ${selectedUserId === user.id ? "bg-white/10" : ""}`}
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
                                        {user.profile?.avatarUrl ? (
                                            <img src={user.profile.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
                                        ) : (
                                            <User className="h-4 w-4 text-indigo-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-white">{user.name}</span>
                                        <span className="text-xs text-zinc-500">{user.email}</span>
                                    </div>
                                    {selectedUserId === user.id && (
                                        <Check className="ml-auto h-4 w-4 text-indigo-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
