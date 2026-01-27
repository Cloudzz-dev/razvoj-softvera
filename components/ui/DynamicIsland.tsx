"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Briefcase, Users, Menu } from "lucide-react";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: Briefcase },
    { href: "/join", label: "Join", icon: Users },
];

export function DynamicIsland() {
    const [isOpen, setIsOpen] = useState(false);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = () => {
            if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) {
                setIsOpen(false);
            }
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [isOpen]);

    const handleHoverStart = () => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
            setIsOpen(true);
        }
    };

    const handleHoverEnd = () => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
            setIsOpen(false);
        }
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
        >
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex flex-col md:flex-row items-center justify-center gap-2 px-6 py-3 rounded-[2rem] md:rounded-full bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-lg font-bold text-white md:mr-4"
                                onClick={() => setIsOpen(false)}
                            >
                                <Image src="/start-it-favicon.png" alt="DFDS.io" width={24} height={24} className="rounded-xl" />
                                DFDS.io
                            </Link>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="md:hidden p-2 text-zinc-400 hover:text-white"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-all w-full md:w-auto"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            <div className="hidden md:block h-6 w-px bg-white/20 mx-2" />

                            <Link
                                href="/login"
                                className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors w-full md:w-auto text-center mt-2 md:mt-0"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={toggleMenu}
                        className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl text-white group hover:bg-black transition-colors"
                    >
                        <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Menu</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
