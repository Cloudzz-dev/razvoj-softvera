"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Search, MessageSquare, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
    {
        number: "1",
        icon: Search,
        title: "Create Your Profile",
        description: "Sign up as a developer, founder, or investor. Tell us about your skills, startup, or investment focus.",
    },
    {
        number: "2",
        icon: MessageSquare,
        title: "Connect & Network",
        description: "Browse startups, find co-founders, or discover talented developers. Send messages and build relationships.",
    },
    {
        number: "3",
        icon: DollarSign,
        title: "Transact Securely",
        description: "Pay developers, receive funding from investors, or invest in promising startups—all on one platform.",
    },
    {
        number: "4",
        icon: TrendingUp,
        title: "Grow Together",
        description: "Track your progress with analytics, expand your network, and build the next big thing together.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.2,
            duration: 0.5,
            ease: "easeOut",
        },
    }),
};

export function HowItWorks() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        How DFDS.io Works
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        From idea to execution, DFDS.io connects the right people at the right time.
                        Here's how to get started in 4 simple steps.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.number}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.5 }}
                                    variants={cardVariants}
                                >
                                    <GlassCard variant="medium" className="p-6 h-full">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                                {step.number}
                                            </div>
                                            <div className="flex-shrink-0 w-12 h-12 rounded-3xl bg-indigo-500/10 flex items-center justify-center relative">
                                                <Icon className="w-6 h-6 text-indigo-400" />
                                                <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-md animate-pulse" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                                            <p className="text-base text-zinc-400 leading-relaxed">{step.description}</p>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
