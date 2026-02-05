"use client";

import { motion } from 'framer-motion';
import { Shield, Mail } from 'lucide-react';
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";

const subProcessors = [
    { provider: "PostHog", purpose: "Product Analytics", data: "Anonymized usage events, clicks, and page views." },
    { provider: "Resend", purpose: "Email Delivery", data: "Your email address and notification content." },
    { provider: "DFDS", purpose: "Infrastructure", data: "All database and application data is hosted on our team's private cluster." }
];

export default function PrivacyPage() {
    return (
        <PageShell>
            <Section className="max-w-4xl mx-auto">
                <header className="mb-16 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest"
                    >
                        <Shield className="w-3.5 h-3.5 text-indigo-400" /> Privacy-First Approach
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                        Privacy Policy
                    </h1>
                    <p className="text-zinc-500 font-medium">Effective Date: January 2026</p>
                </header>

                <div className="space-y-12">
                    <section>
                        <p className="text-xl leading-relaxed text-zinc-300 text-center max-w-3xl mx-auto">
                            Welcome to <strong className="text-white">DFDS.io</strong>. We are a platform built by founders, for founders. We take a "Privacy-First" approach to your data. We don't sell your data, and we don't track you across the web.
                        </p>
                    </section>

                    <GlassCard className="p-8 md:p-12 border-white/10 bg-black/40 backdrop-blur-xl space-y-12">
                        <section className="space-y-6">
                            <h2 className="text-3xl font-bold text-white tracking-tight border-b border-white/5 pb-4">1. The Data We Collect</h2>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-zinc-200">A. Account & Identity</h3>
                                    <ul className="space-y-3 text-zinc-400">
                                        <li className="flex gap-3"><span className="text-white font-bold">•</span> <span><strong className="text-zinc-200">Authentication:</strong> We collect your email and password. Passwords are cryptographically hashed.</span></li>
                                        <li className="flex gap-3"><span className="text-white font-bold">•</span> <span><strong className="text-zinc-200">Web3 Identity:</strong> If you connect a wallet, we store your public Ethereum address.</span></li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-zinc-200">B. Professional Profile</h3>
                                    <ul className="space-y-3 text-zinc-400">
                                        <li className="flex gap-3"><span className="text-white font-bold">•</span> <span><strong className="text-zinc-200">Profile Details:</strong> Bio, skills, location, and professional social links.</span></li>
                                        <li className="flex gap-3"><span className="text-white font-bold">•</span> <span><strong className="text-zinc-200">Startup Info:</strong> Pitch decks, stage of company, and team membership details.</span></li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-3xl font-bold text-white tracking-tight border-b border-white/5 pb-4">2. Third-Party Service Providers</h2>
                            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                                <div className="grid grid-cols-3 bg-white/5 py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/10">
                                    <div>Provider</div>
                                    <div>Purpose</div>
                                    <div>Data Involved</div>
                                </div>
                                {subProcessors.map((sp) => (
                                    <div key={sp.provider} className="grid grid-cols-3 py-6 px-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <div className="font-bold text-white">{sp.provider}</div>
                                        <div className="text-sm text-zinc-300 pr-4 leading-relaxed">{sp.purpose}</div>
                                        <div className="text-sm text-zinc-500 leading-relaxed">{sp.data}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-3xl font-bold text-white tracking-tight border-b border-white/5 pb-4">3. Your Rights</h2>
                            <p className="text-lg text-zinc-400 leading-relaxed">
                                We believe you should own your data. You can access or delete your account at any time. Because our database uses "Cascading Deletes," removing your account automatically wipes all associated data from our active records.
                            </p>
                        </section>

                        <section className="pt-8">
                            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 text-center space-y-6">
                                <h2 className="text-3xl font-bold text-white tracking-tight">Contact Our Team</h2>
                                <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                    Questions about your data? Reach out to our founding team directly.
                                </p>
                                <a
                                    href="mailto:team@cloudzz.dev"
                                    className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all transform hover:scale-105"
                                >
                                    <Mail className="w-5 h-5" /> team@cloudzz.dev
                                </a>
                            </div>
                        </section>
                    </GlassCard>
                </div>

                <footer className="mt-20 text-center text-zinc-600 text-[10px] tracking-[0.2em] uppercase font-bold">
                    &copy; 2026 DFDS.io &bull; Built with Privacy in Mind
                </footer>
            </Section>
        </PageShell>
    );
}
