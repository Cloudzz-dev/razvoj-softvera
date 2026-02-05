import { Metadata } from "next";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { Link2, BarChart3, Bot, Wallet, Globe, Award } from "lucide-react";

export const metadata: Metadata = {
    title: "About Us | DFDS.io",
    description: "Learn about DFDS.io - connecting founders, developers, and investors. Built by DFDS from Zadar, Croatia.",
};

export default function AboutPage() {
    return (
        <PageShell>
            {/* Hero Section */}
            <Section className="text-center pt-12 md:pt-20">
                <div className="space-y-6 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                        About Us
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-400 font-medium italic">
                        Built by devs for devs and by founders for founders.
                    </p>
                    
                    <div className="space-y-6 mt-12">
                        <p className="text-xl text-zinc-300 leading-relaxed">
                            We're <span className="text-white font-semibold underline decoration-indigo-500/50 underline-offset-4">DFDS</span>, a small but dedicated three-person team from Zadar, Croatia — Leon, Roko, and Frane.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
                            What started as a simple idea during the <span className="text-white font-medium">Zadar Smart City Hackathon 2025</span> has grown into a platform we believe can transform how early-stage projects are built, funded, and launched.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Mission Section */}
            <Section>
                <GlassCard className="max-w-4xl mx-auto py-16 px-8 text-center space-y-8 border-white/10 bg-black/40 backdrop-blur-xl">
                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Our Mission</h2>
                    <div className="space-y-6">
                        <p className="text-xl md:text-2xl text-zinc-200 font-light leading-relaxed">
                            To make it easy for startups, investors, and developers to connect, collaborate, and make progress faster — all within one streamlined environment.
                        </p>
                        <p className="text-lg text-zinc-500 italic">
                            No barriers, no unnecessary complexity, just a practical platform where innovation and opportunity meet.
                        </p>
                    </div>
                </GlassCard>
            </Section>

            {/* What We're Building Section */}
            <Section className="space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">What We&apos;re Building</h2>
                    <p className="text-zinc-400 text-lg">A unified ecosystem for the next generation of builders.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GlassCard hoverEffect className="p-8 space-y-6 bg-black/40 border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white">
                                <Link2 size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">A Smarter Way to Connect</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            DFDS.io is not a social network — it&apos;s a focused networking engine. Founders can showcase their ideas, developers can join projects, investors can explore rising teams.
                        </p>
                    </GlassCard>

                    <GlassCard hoverEffect className="p-8 space-y-6 bg-black/40 border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Real-Time Analytics</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Growth metrics, engagement dashboards, and startup progress tracking. We provide clear, actionable insights to help both founders and investors make confident decisions.
                        </p>
                    </GlassCard>

                    <GlassCard hoverEffect className="p-8 space-y-6 bg-black/40 border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white">
                                <Bot size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">AI-Driven Support</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            DFDS.io includes an integrated AI system built to assist users with planning, optimization, and troubleshooting across business and development challenges.
                        </p>
                    </GlassCard>

                    <GlassCard hoverEffect className="p-8 space-y-6 bg-black/40 border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white">
                                <Wallet size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Secure Infrastructure</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Startups and investors can use secure payments and identity verification to ensure a safe and reliable environment for collaboration and funding.
                        </p>
                    </GlassCard>
                </div>
            </Section>

            {/* Built by DFDS Section */}
            <Section className="text-center pb-24">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-zinc-500 tracking-[0.2em] uppercase">Built by DFDS</h2>
                        <p className="text-3xl md:text-4xl font-semibold text-white">From Zadar. For builders everywhere.</p>
                    </div>
                    
                    <div className="flex justify-center flex-wrap gap-4">
                        <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium transition-all hover:bg-white/10">
                            <Globe size={20} className="text-blue-400" />
                            <span>Croatia</span>
                        </div>
                        <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium transition-all hover:bg-white/10">
                            <Award size={20} className="text-indigo-400" />
                            <span>Hackathon 2025</span>
                        </div>
                    </div>
                </div>
            </Section>
        </PageShell>
    );
}
