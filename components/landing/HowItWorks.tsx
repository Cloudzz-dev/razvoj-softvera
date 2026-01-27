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
        <div className="relative z-10 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <motion.div
                            key={step.number}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={cardVariants}
                        >
                            <GlassCard variant="medium" className="p-5 h-full hover:bg-white/10 transition-colors border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                                        {step.number}
                                    </div>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
