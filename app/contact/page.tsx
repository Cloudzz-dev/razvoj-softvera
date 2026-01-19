"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Mail } from "lucide-react";
import posthog from "posthog-js";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />

            <div className="container mx-auto max-w-2xl relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
                    <p className="text-zinc-400 text-lg">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>

                <GlassCard className="p-8 border-white/10 bg-black/40 flex flex-col items-center text-center">
                    <div className="p-6 rounded-full bg-indigo-500/10 text-indigo-400 mb-6">
                        <Mail className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
                    <p className="text-zinc-400 mb-8 max-w-md">
                        For inquiries, partnerships, or support, reach out to us via email.
                    </p>
                    <a
                        href="mailto:team@cloudzz.dev"
                        onClick={() => posthog.capture("contact_email_clicked", { email: "team@cloudzz.dev" })}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-lg"
                    >
                        <Mail className="w-5 h-5" />
                        Email Us
                    </a>
                    <p className="text-zinc-500 mt-4 text-sm">team@cloudzz.dev</p>
                </GlassCard>
            </div>
        </div>
    );
}
