"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { Mail, MessageSquare } from "lucide-react";
import posthog from "posthog-js";

export default function ContactPage() {
    return (
        <PageShell>
            <Section className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">Contact Us</h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Have questions or ideas? We&apos;d love to hear from you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                    <GlassCard className="p-8 border-white/10 bg-black/40 backdrop-blur-xl flex flex-col items-center text-center space-y-6">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-white">
                            <Mail className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Email Us</h2>
                            <p className="text-zinc-400 leading-relaxed">
                                For inquiries, partnerships, or support, reach out to our team.
                            </p>
                        </div>
                        <a
                            href="mailto:team@cloudzz.dev"
                            onClick={() => posthog.capture("contact_email_clicked", { email: "team@cloudzz.dev" })}
                            className="w-full py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Mail className="w-5 h-5" />
                            team@cloudzz.dev
                        </a>
                    </GlassCard>

                    <GlassCard className="p-8 border-white/10 bg-black/40 backdrop-blur-xl flex flex-col items-center text-center space-y-6">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-white">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Socials</h2>
                            <p className="text-zinc-400 leading-relaxed">
                                Follow our journey and get the latest updates from DFDS.io.
                            </p>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-4">
                            <a
                                href="https://twitter.com/dfds_dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                Twitter
                            </a>
                            <a
                                href="https://github.com/dfds-dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                GitHub
                            </a>
                        </div>
                    </GlassCard>
                </div>
            </Section>
        </PageShell>
    );
}
