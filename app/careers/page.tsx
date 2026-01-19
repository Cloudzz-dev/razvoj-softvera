import { GlassCard } from "@/components/ui/GlassCard";

export default function CareersPage() {
    return (
        <main className="min-h-screen bg-black text-white py-16 px-4 md:px-8 flex items-center justify-center">
            <GlassCard className="max-w-2xl p-8 border-white/10 text-center">
                <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
                <p className="text-zinc-400 mb-8">
                    We're always looking for talented individuals to help us build the future of startup networking.
                    While we don't have any open positions right now, feel free to send your resume to careers@dfds.
                </p>
            </GlassCard>
        </main>
    );
}
