"use client";

import { useState } from "react";
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
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <AnimatePresence>
                {isHovered ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl"
                    >
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-lg font-bold text-white mr-4"
                        >
                            <Image src="/start-it-favicon.png" alt="DFDS.io" width={24} height={24} className="rounded-xl" />
                            DFDS.io
                        </Link>

                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="h-6 w-px bg-white/20 mx-2" />

                        <Link
                            href="/login"
                            className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
                        >
                            Login
                        </Link>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl text-white"
                    >
                        <Menu className="w-5 h-5" />
                        <span>Menu</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
