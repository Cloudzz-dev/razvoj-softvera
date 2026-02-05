import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TermsPage() {
    return (
        <PageShell>
            <Section className="max-w-4xl mx-auto">
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">Terms of Service</h1>
                        <p className="text-zinc-500 font-medium">Last updated: January 2026</p>
                    </div>

                    <GlassCard className="p-8 md:p-12 border-white/10 bg-black/40 backdrop-blur-xl prose prose-invert prose-zinc max-w-none">
                        <p className="text-xl text-zinc-300 leading-relaxed mb-8">
                            By using DFDS.io, you agree to these terms. This platform is provided to connect founders, developers, and investors in a secure and professional environment.
                        </p>
                        
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-zinc-400 mb-6">
                            By accessing or using DFDS.io, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
                        <p className="text-zinc-400 mb-6">
                            Permission is granted to temporarily download one copy of the materials (information or software) on DFDS.io for personal, non-commercial transitory viewing only.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
                        <p className="text-zinc-400 mb-6">
                            The materials on DFDS.io are provided on an 'as is' basis. DFDS.io makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
                        <p className="text-zinc-400 mb-6">
                            In no event shall DFDS.io or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on DFDS.io.
                        </p>

                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <p className="text-zinc-500 text-sm italic">
                                For full legal inquiries, please contact us at <a href="mailto:legal@dfds.io" className="text-white hover:underline">legal@dfds.io</a>
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </Section>
        </PageShell>
    );
}
