"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    Search,
    Home,
    LogOut,
    Plus,
    Copy,
    ExternalLink,
    Moon,
    Sun,
    Laptop,
    FileText,
    Info,
    Mail,
    Briefcase,
    LogIn,
    UserPlus,
    LayoutDashboard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { dashboardNav } from "@/config/nav";
import { signOut, useSession, signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { setTheme } = useTheme();
    const { data: session } = useSession();

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

    const copyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("URL copied to clipboard");
    };

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
                        className="flex h-14 w-full rounded-2xl bg-transparent py-3 text-base outline-none placeholder:text-white/40 text-white disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                    <Command.Empty className="py-6 text-center text-sm text-white/50">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-medium text-white/40 px-2 py-1.5 mb-2">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/"))}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            <span>Home</span>
                        </CommandItem>

                        {session?.user ? (
                            <>
                                <CommandItem
                                    onSelect={() => runCommand(() => router.push("/dashboard"))}
                                >
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    <span>Dashboard</span>
                                </CommandItem>
                                {dashboardNav.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <CommandItem
                                            key={item.href}
                                            onSelect={() => runCommand(() => router.push(item.href))}
                                        >
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span>{item.name}</span>
                                        </CommandItem>
                                    );
                                })}
                            </>
                        ) : (
                            <>
                                <CommandItem
                                    onSelect={() => runCommand(() => router.push("/login"))}
                                >
                                    <LogIn className="mr-2 h-4 w-4" />
                                    <span>Login</span>
                                </CommandItem>
                                <CommandItem
                                    onSelect={() => runCommand(() => router.push("/register"))}
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    <span>Register</span>
                                </CommandItem>
                            </>
                        )}
                    </Command.Group>

                    <Command.Group heading="General" className="text-xs font-medium text-white/40 px-2 py-1.5 mb-2">
                        <CommandItem onSelect={() => runCommand(() => router.push("/about"))}>
                            <Info className="mr-2 h-4 w-4" />
                            <span>About Us</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/blog"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Blog</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/careers"))}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Careers</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/contact"))}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Contact</span>
                        </CommandItem>
                    </Command.Group>

                    <Command.Group heading="Theme" className="text-xs font-medium text-white/40 px-2 py-1.5 mb-2">
                        <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Light Mode</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Dark Mode</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>System Theme</span>
                        </CommandItem>
                    </Command.Group>

                    <Command.Group heading="Actions" className="text-xs font-medium text-white/40 px-2 py-1.5 mb-2">
                        {session?.user && (
                            <CommandItem
                                onSelect={() => runCommand(() => router.push("/dashboard/startups?action=new"))}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                               <span>Create New Startup</span>
                            </CommandItem>
                        )}
                        <CommandItem
                            onSelect={() => runCommand(() => copyUrl())}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Copy Current URL</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => window.open("https://github.com/team-cloudzz/dfds", "_blank"))}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            <span>View Source Code</span>
                        </CommandItem>

                        {session?.user && (
                            <CommandItem
                                onSelect={() => runCommand(() => signOut({ callbackUrl: "/" }))}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign Out</span>
                            </CommandItem>
                        )}
                    </Command.Group>
                </Command.List>

                <div className="border-t border-white/5 py-2 px-4 flex justify-between items-center text-white/40">
                    <span className="text-[10px]">DFDS Command Menu</span>
                    <div className="flex gap-2">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white opacity-100">
                            <span className="text-xs">↑↓</span>
                        </kbd>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white opacity-100">
                            <span className="text-xs">ENTER</span>
                        </kbd>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white opacity-100">
                            <span className="text-xs">ESC</span>
                        </kbd>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
}

interface CommandItemProps {
    children: React.ReactNode;
    onSelect?: () => void;
}

function CommandItem({ children, onSelect }: CommandItemProps) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none hover:bg-white/10 hover:text-white aria-selected:bg-white/10 aria-selected:text-white transition-colors duration-150 data-[disabled]:opacity-50"
        >
            {children}
        </Command.Item>
    );
}
