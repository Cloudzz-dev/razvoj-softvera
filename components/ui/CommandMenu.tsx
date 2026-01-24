"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Monitor, User, Settings, LayoutDashboard, Map, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    if (!open) return null;

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
            onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
            }}
        >
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-white/5 px-4" cmdk-input-wrapper="">
                    <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-white" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex h-14 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-white/40 text-white disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                    <Command.Empty className="py-6 text-center text-sm text-white/50">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-medium text-white/40 px-2 py-1.5 mb-2">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/"))}
                            onMouseEnter={() => router.prefetch("/")}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            <span>Home</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard"))}
                            onMouseEnter={() => router.prefetch("/dashboard")}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/roadmap"))}
                            onMouseEnter={() => router.prefetch("/roadmap")}
                        >
                            <Map className="mr-2 h-4 w-4" />
                            <span>Roadmap</span>
                        </CommandItem>
                    </Command.Group>

                    <Command.Group heading="Settings" className="text-xs font-medium text-white/40 px-2 py-1.5 mb-2">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/profile"))}
                            onMouseEnter={() => router.prefetch("/profile")}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/settings"))}
                            onMouseEnter={() => router.prefetch("/settings")}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => console.log("Toggle Theme"))}
                        >
                            <Monitor className="mr-2 h-4 w-4" />
                            <span>Toggle Theme</span>
                        </CommandItem>
                    </Command.Group>
                </Command.List>

                <div className="border-t border-white/5 py-2 px-4 flex justify-end">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white opacity-100">
                        <span className="text-xs">ESC</span>
                    </kbd>
                </div>
            </div>
        </Command.Dialog>
    );
}

interface CommandItemProps {
    children: React.ReactNode;
    onSelect?: () => void;
    onMouseEnter?: () => void;
}

function CommandItem({ children, onSelect, onMouseEnter }: CommandItemProps) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-white/70 outline-none hover:bg-white/10 hover:text-white data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors duration-150"
            onPointerEnter={onMouseEnter} // Use pointer enter for hover
        >
            {children}
        </Command.Item>
    );
}
