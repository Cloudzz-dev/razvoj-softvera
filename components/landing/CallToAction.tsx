"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";

export function CallToAction() {
    const session = useSession();
    const status = session?.status;

    return (
        <section className="py-24 relative overflow-hidden">
            <motion.div
                className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]"
                animate={{
                    scale: [1, 0.8, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5,
                }}
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <GlassCard variant="dark" className="max-w-4xl mx-auto text-center p-12 md:p-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        {status === "loading" ? "Ready to get started?" : status === "authenticated" ? "Ready to keep building?" : "Ready to build the next unicorn?"}
                    </h2>
                    <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
                        Join founders, developers, and investors who are building the future on DFDS.io.
                    </p>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        {status === "loading" ? (
                            <div className="w-48 h-14 rounded-full bg-white/10 animate-pulse" />
                        ) : status === "authenticated" ? (
                            <Link
                                href="/dashboard"
                                onClick={() => posthog.capture("cta_clicked", { cta_type: "dashboard", is_authenticated: true })}
                                className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 mx-auto w-auto justify-center"
                            >
                                Go to Dashboard <ArrowRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <Link
                                href="/join"
                                onClick={() => posthog.capture("cta_clicked", { cta_type: "signup", is_authenticated: false })}
                                className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 mx-auto w-auto justify-center"
                            >
                                Get Started Now <ArrowRight className="w-5 h-5" />
                            </Link>
                        )}
                    </motion.div>
                </GlassCard>
            </div>
        </section>
    );
}
