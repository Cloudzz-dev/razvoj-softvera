"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { ArrowRight, Code2, Rocket, TrendingUp } from "lucide-react";
import { DynamicIsland } from "@/components/ui/DynamicIsland";
import DonateButton from "@/components/common/DonateButton";

const featureCards = [
    {
        id: "developers",
        icon: Code2,
        title: "For Developers",
        description: "Find paid gigs, co-founder roles, and open source projects.",
        color: "indigo",
    },
    {
        id: "founders",
        icon: Rocket,
        title: "For Founders",
        description: "Connect with top talent and get your pitch in front of investors.",
        color: "purple",
    },
    {
        id: "investors",
        icon: TrendingUp,
        title: "For Investors",
        description: "Discover the next unicorn before it hits the mainstream.",
        color: "emerald",
    },
] as const;

export function HeroSection() {
    const session = useSession();
    const status = session?.status;

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 overflow-hidden">
            <DynamicIsland />

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 mb-4"
                >
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    A Network for Founders & Devs (DFDS)
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 text-balance max-w-4xl"
                >
                    Build the Future. <br />
                    <span className="text-white">Together.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl text-balance"
                >
                    DFDS connects visionary founders with elite developers and investors.
                    Stop searching, start building.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col items-center gap-4 mt-4"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {status === "loading" ? (
                            // Loading skeleton to prevent UI flash
                            <div className="flex items-center gap-4">
                                <div className="w-40 h-12 rounded-full bg-white/10 animate-pulse" />
                                <div className="w-24 h-12 rounded-full bg-white/5 animate-pulse" />
                            </div>
                        ) : status === "authenticated" ? (
                            <Link
                                href="/dashboard"
                                className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                aria-label="Visit your dashboard"
                            >
                                Visit Dashboard <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/join"
                                    className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    aria-label="Join the DFDS network"
                                >
                                    Join Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    aria-label="Login to DFDS"
                                >
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                    {status !== "authenticated" && status !== "loading" && (
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href="/discover"
                                className="px-6 py-2 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full"
                                aria-label="Discover DFDS"
                            >
                                Discover DFDS <ArrowRight className="w-3 h-3" aria-hidden="true" />
                            </Link>
                            <DonateButton />
                        </div>
                    )}
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 w-full max-w-5xl"
                >
                    {featureCards.map((card) => (
                        <GlassCard key={card.id} hoverEffect>
                            <article className="flex flex-col items-center text-center gap-3 p-6">
                                <div className={`p-3 rounded-full bg-${card.color}-500/10 text-${card.color}-400`}>
                                    <card.icon className="w-6 h-6" aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                                <p className="text-sm text-zinc-400">{card.description}</p>
                            </article>
                        </GlassCard>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
