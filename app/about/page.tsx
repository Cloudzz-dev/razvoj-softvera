import { Metadata } from "next";
import { GlassCard } from "@/components/ui/GlassCard";
import { Link2, BarChart3, Bot, Wallet, Globe, Award } from "lucide-react";

export const metadata: Metadata = {
    title: "About Us | DFDS.io",
    description: "Learn about DFDS.io - connecting founders, developers, and investors. Built by DFDS from Zadar, Croatia.",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 py-24 relative z-10">
                {/* Hero Section */}
                <section className="text-center space-y-8 mb-24">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            About Us
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 font-light tracking-wide italic">
                            Built by devs for devs and by founders for founders.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-6">
                        <p className="text-xl text-zinc-300 leading-relaxed">
                            We're <span className="text-white font-medium underline decoration-indigo-500/50 underline-offset-4">DFDS</span>, a small but dedicated three-person team from Zadar, Croatia — Leon, Roko, and Frane.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            What started as a simple idea during the <span className="text-white font-medium">Zadar Smart City Hackathon 2025</span> has grown into a platform we believe can transform how early-stage projects are built, funded, and launched.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            We've all seen how difficult it can be for founders to find the right developers, for investors to discover promising teams, and for developers to locate real projects worth contributing to. DFDS.io was created to bring all of these people together in a single, unified ecosystem.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="mb-32">
                    <GlassCard className="max-w-4xl mx-auto py-12 px-8 text-center space-y-6 border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h2>
                        <div className="space-y-6">
                            <p className="text-xl text-zinc-200 font-light leading-relaxed">
                                Our mission is to make it easy for startups, investors, and developers to connect, collaborate, and make progress faster — all within one streamlined environment.
                            </p>
                            <p className="text-lg text-zinc-400 italic">
                                No barriers, no unnecessary complexity, just a practical platform where innovation and opportunity meet.
                            </p>
                        </div>
                    </GlassCard>
                </section>

                {/* What We're Building Section */}
                <section className="space-y-12 mb-32">
                    <h2 className="text-4xl font-bold text-white text-center tracking-tight">What We&apos;re Building</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard hoverEffect className="space-y-4 border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <Link2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">A Smarter Way to Connect</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed">
                                DFDS.io is not a social network — it&apos;s a focused networking engine. Founders can showcase their ideas, developers can join projects, investors can explore rising teams, and everyone can communicate through an integrated messaging system.
                            </p>
                        </GlassCard>

                        <GlassCard hoverEffect className="space-y-4 border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                    <BarChart3 size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Real-Time Analytics</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed">
                                Growth metrics, engagement dashboards, and startup progress tracking. We provide clear, actionable insights to help both founders and investors make confident decisions.
                            </p>
                        </GlassCard>

                        <GlassCard hoverEffect className="space-y-4 border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <Bot size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">AI-Driven Support</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed">
                                DFDS.io includes an integrated AI system built to assist users with planning, optimization, and troubleshooting across a variety of business and development challenges.
                            </p>
                        </GlassCard>

                        <GlassCard hoverEffect className="space-y-4 border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    <Wallet size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Crypto-Enabled Payments</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed">
                                Startups and investors can use secure cryptocurrency payments to avoid traditional banking limitations and enable fast, global transactions.
                            </p>
                        </GlassCard>
                    </div>
                </section>

                {/* Why We Built This Section */}
                <section className="mb-32 text-center space-y-8">
                    <h2 className="text-4xl font-bold text-white tracking-tight">Why We Built This</h2>
                    <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-10 md:p-12 space-y-6">
                        <p className="text-xl text-zinc-300 leading-relaxed">
                            We wanted to create the tool we always wished existed: a place where founders, developers, and investors can work together without scattered platforms, endless spreadsheets, or chaotic chat threads.
                        </p>
                    </div>
                </section>

                {/* Built by DFDS Section */}
                <section className="text-center space-y-8 pb-16">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Built by DFDS</h2>
                        <p className="text-lg text-zinc-400">From Zadar. For builders everywhere.</p>
                    </div>
                    <div className="flex justify-center flex-wrap gap-4 pt-4">
                        <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm transition-colors hover:bg-white/10">
                            <Globe size={16} className="text-indigo-400" />
                            Croatia
                        </div>
                        <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm transition-colors hover:bg-white/10">
                            <Award size={16} className="text-purple-400" />
                            Hackathon 2025
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
