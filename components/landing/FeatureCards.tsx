"use client";

import React from "react";
import { Code2, Rocket, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

const featureCards = [
    {
        id: "developers",
        icon: Code2,
        title: "For Developers",
        description: "Find paid gigs & co-founder roles.",
    },
    {
        id: "founders",
        icon: Rocket,
        title: "For Founders",
        description: "Connect with talent & investors.",
    },
    {
        id: "investors",
        icon: TrendingUp,
        title: "For Investors",
        description: "Discover the next unicorn early.",
    },
] as const;

export function FeatureCards() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto"
        >
            {featureCards.map((card) => (
                <GlassCard key={card.id} className="p-4 hover:bg-white/10 transition-colors border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="flex flex-col items-start gap-2">
                        <div className="p-2 rounded-lg bg-white/10 text-white">
                            <card.icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                            <p className="text-xs text-zinc-400 leading-snug mt-1">{card.description}</p>
                        </div>
                    </div>
                </GlassCard>
            ))}
        </motion.div>
    );
}
