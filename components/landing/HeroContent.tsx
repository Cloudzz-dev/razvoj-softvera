"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DonateButton from "@/components/common/DonateButton";

export function HeroContent() {
    const session = useSession();
    const status = session?.status;

    return (
        <div className="flex flex-col items-start text-left gap-6 z-10 h-full justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium tracking-wider text-zinc-400 uppercase"
            >
                DFDS.io
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 text-balance max-w-4xl"
            >
                Build the Future. <br />
                <span className="text-white">Together.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-800 max-w-xl text-balance"
            >
                DFDS connects visionary founders with elite developers and investors.
                Stop searching, start building.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start gap-4 mt-2"
            >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {status === "loading" ? (
                        <div className="flex items-center gap-4">
                            <div className="w-40 h-12 rounded-full bg-white/10 animate-pulse" />
                            <div className="w-24 h-12 rounded-full bg-white/5 animate-pulse" />
                        </div>
                    ) : status === "authenticated" ? (
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                        >
                            Visit Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/join"
                                className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                            >
                                Join Now <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                href="/login"
                                className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-sm"
                            >
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
