"use client";

import React from "react";
import { ArrowRight, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";

export function ModernFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-black border-t border-white/10 pt-16 pb-8 overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="text-2xl font-bold text-white mb-4">DFDS.io</h2>
                        <p className="text-zinc-400 max-w-sm mb-6">
                            Connecting visionary founders with elite developers and investors. Build the future, together.
                        </p>
                        <div className="flex gap-4">
                            <SocialLink href="/twitter" icon={<Twitter className="w-5 h-5" />} label="Twitter" />
                            <SocialLink href="/github" icon={<Github className="w-5 h-5" />} label="GitHub" />
                            <SocialLink href="/linkedin" icon={<Linkedin className="w-5 h-5" />} label="LinkedIn" />
                            <SocialLink href="mailto:hello@dfds" icon={<Mail className="w-5 h-5" />} label="Email" />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Discover</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/discover?tab=startups">Browse Startups</FooterLink>
                            <FooterLink href="/discover?tab=developers">Find Developers</FooterLink>
                            <FooterLink href="/discover?tab=investors">Investor Network</FooterLink>
                            <FooterLink href="/discover">Discover DFDS.io</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/about">About Us</FooterLink>
                            <FooterLink href="/careers">Careers</FooterLink>
                            <FooterLink href="/blog">Blog</FooterLink>
                            <FooterLink href="/roadmap">Roadmap</FooterLink>
                            <FooterLink href="/contact">Contact</FooterLink>
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-4 lg:col-span-1">
                        <GlassCard className="p-6 border-white/10 bg-white/5 rounded-3xl h-full">
                            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
                            <p className="text-zinc-400 text-sm mb-4">Get the latest news and updates from DFDS.io.</p>
                            <form className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-black/20"
                                />
                                <button
                                    type="submit"
                                    className="p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shrink-0"
                                    aria-label="Subscribe"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        </GlassCard>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-zinc-500">
                        <p>© {currentYear} DFDS.io Inc. All rights reserved.</p>
                        <span className="hidden sm:inline">•</span>
                        <p className="flex items-center gap-1">
                            Built with <span className="font-semibold text-white">Next.js</span>
                        </p>
                    </div>
                    <div className="flex gap-6 text-sm text-zinc-500">
                        <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <motion.a
            href={href}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={label}
        >
            {icon}
        </motion.a>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <a href={href} className="text-zinc-400 hover:text-white transition-colors text-sm">
                {children}
            </a>
        </li>
    );
}
