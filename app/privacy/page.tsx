"use client";

import { motion } from 'framer-motion';
import { Shield, Mail } from 'lucide-react';

const subProcessors = [
    { provider: "PostHog", purpose: "Product Analytics", data: "Anonymized usage events, clicks, and page views." },
    { provider: "Resend", purpose: "Email Delivery", data: "Your email address and notification content." },
    { provider: "DFDS", purpose: "Infrastructure", data: "All database and application data is hosted on our team's private cluster." }
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-zinc-300 py-24 px-4 md:px-8 selection:bg-blue-500/30">
            <div className="max-w-3xl mx-auto">
                {/* Hero */}
                <header className="mb-16 text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6"
                    >
                        <Shield className="w-3.5 h-3.5" /> Privacy-First Approach
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
                    >
                        Privacy Policy
                    </motion.h1>
                    <p className="text-zinc-500 text-sm">Effective Date: December 21, 2025</p>
                </header>

                <div className="prose prose-invert prose-zinc max-w-none space-y-12">
                    <section>
                        <p className="text-lg leading-relaxed text-zinc-300">
                            Welcome to <strong>dfds</strong>. We are a platform built by founders, for founders. Because we value the entrepreneurial community, we take a "Privacy-First" approach to your data. We don't sell your data, and we don't track you across the web.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/5 pb-2">1. The Data We Collect</h2>

                        <h3 className="text-lg font-medium text-zinc-200 mt-8 mb-4">A. Account & Identity</h3>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Authentication:</strong> We collect your email and password. <span className="text-zinc-500 italic">Note: Passwords are cryptographically hashed; we never store or see your "plain-text" password.</span></li>
                            <li><strong className="text-zinc-200">Web3 Identity:</strong> If you connect a wallet, we store your public Ethereum (EOA) address.</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-8 mb-4">B. Professional Profile</h3>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Founder/Developer Details:</strong> Information you provide such as your bio, skills, location, GitHub/LinkedIn URLs, and investment focus (for investors).</li>
                            <li><strong className="text-zinc-200">Startup Info:</strong> Pitch decks, stage of company, and team membership details.</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-8 mb-4">C. Community & Interactions</h3>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Public Content:</strong> Threads, replies, and likes you post in the community.</li>
                            <li><strong className="text-zinc-200">Private Messaging:</strong> Content of messages sent between users to facilitate co-founder matching.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/5 pb-2">2. How We Use Your Data</h2>
                        <p className="text-zinc-400">We use your information strictly to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li>Facilitate connections between founders, developers, and investors.</li>
                            <li>Authenticate your access and secure your account.</li>
                            <li>Notify you of messages or team invites (via email).</li>
                            <li>Improve our platform by understanding which features are most used.</li>
                        </ul>
                    </section>

                    {/* The "Grid" Section */}
                    <section className="not-prose py-8">
                        <h2 className="text-2xl font-semibold text-white mb-8 flex items-center gap-3">
                            3. Third-Party Service Providers
                        </h2>
                        <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black">
                            <div className="grid grid-cols-3 bg-white/5 py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/5">
                                <div>Provider</div>
                                <div>Purpose</div>
                                <div>Data Involved</div>
                            </div>
                            {subProcessors.map((sp) => (
                                <div key={sp.provider} className="grid grid-cols-3 py-6 px-6 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors border-b border-white/5 last:border-0">
                                    <div className="font-bold text-blue-400">{sp.provider}</div>
                                    <div className="text-sm text-zinc-300 pr-4 leading-relaxed">{sp.purpose}</div>
                                    <div className="text-sm text-zinc-500 leading-relaxed">{sp.data}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/5 pb-2">4. Data Security</h2>
                        <p className="text-zinc-400">As a security-focused team, we implement the following:</p>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Encryption:</strong> All data in transit is protected via TLS 1.3.</li>
                            <li><strong className="text-zinc-200">Credential Safety:</strong> We use industry-standard salting and hashing for all passwords and API key hashes.</li>
                            <li><strong className="text-zinc-200">Isolation:</strong> Our database is hosted within a private Kubernetes network, isolated from the public internet.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/5 pb-2">5. Your Rights & Data Deletion</h2>
                        <p className="text-zinc-400 mb-6">We believe you should own your data.</p>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Access:</strong> You can request a copy of all data we have associated with your account.</li>
                            <li><strong className="text-zinc-200">Deletion:</strong> You can delete your account at any time. Because our database uses "Cascading Deletes," removing your account automatically wipes your profile, sessions, and associated private data from our active records.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/5 pb-2">6. Children's Privacy</h2>
                        <p className="text-zinc-400">DFDS.io is intended for users aged 13 and older. We do not knowingly collect data from children under the age of 13.</p>
                    </section>

                    <section className="not-prose pt-12 pb-24">
                        <div className="p-10 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-center backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">7. Contact Us</h2>
                            <p className="text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                Questions about your data? Reach out to our founding team directly.
                            </p>
                            <a
                                href="mailto:team@cloudzz.dev"
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold hover:bg-blue-500 hover:text-white transition-all transform hover:scale-105"
                            >
                                <Mail className="w-5 h-5" /> team@cloudzz.dev
                            </a>
                        </div>
                    </section>
                </div>

                <footer className="mt-12 pt-8 border-t border-white/5 text-center text-zinc-700 text-[10px] tracking-widest uppercase">
                    &copy; 2025 dfds &bull; Built with Privacy in Mind
                </footer>
            </div>
        </main>
    );
}
