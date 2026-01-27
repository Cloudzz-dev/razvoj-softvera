"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
    variant?: "switch" | "button";
}

export function ThemeToggle({ variant = "button" }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (variant === "switch") {
        return (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-white">Appearance</h3>
                    <p className="text-xs text-zinc-400">Switch between dark and light mode</p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/5">
                    <button
                        onClick={() => setTheme("light")}
                        aria-label="Switch to light mode"
                        className={`p-2 rounded-full transition-all ${theme === "light" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTheme("dark")}
                        aria-label="Switch to dark mode"
                        className={`p-2 rounded-full transition-all ${theme === "dark" ? "bg-zinc-800 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTheme("system")}
                        aria-label="Switch to system theme"
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${theme === "system"
                            ? "bg-zinc-800 text-white border border-white/10"
                            : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        System
                    </button>
                </div>
            </div>
        );
    }

    // Button Variant (for Landing Page/Header)
    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="w-4 h-4" />
            ) : (
                <Moon className="w-4 h-4" />
            )}
        </button>
    );
}
