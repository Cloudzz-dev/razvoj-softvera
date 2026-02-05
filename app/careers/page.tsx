import { GlassCard } from "@/components/ui/GlassCard";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { Briefcase } from "lucide-react";

export default function CareersPage() {
    return (
        <PageShell>
            <Section className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="max-w-3xl w-full p-12 border-white/10 bg-black/40 backdrop-blur-xl text-center space-y-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <Briefcase size={32} />
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Join Our Team</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            We&apos;re always looking for talented individuals to help us build the future of startup networking.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-zinc-300">
                        <p className="text-lg">
                            While we don&apos;t have any open positions right now, we&apos;re always excited to meet passionate builders.
                        </p>
                    </div>

                    <p className="text-zinc-500">
                        Feel free to send your resume or portfolio to{" "}
                        <a href="mailto:careers@dfds.io" className="text-white hover:underline underline-offset-4 font-medium transition-colors">
                            careers@dfds.io
                        </a>
                    </p>
                </GlassCard>
            </Section>
        </PageShell>
    );
}
