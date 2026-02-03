import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-96 bg-white/5 rounded" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-64 bg-white/5 rounded-lg" />
                    <div className="h-10 w-32 bg-indigo-600/20 rounded-lg" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <GlassCard key={i} className="p-6 border-white/10 bg-black/40">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-white/10" />
                                <div>
                                    <div className="h-6 w-32 bg-white/10 rounded mb-2" />
                                    <div className="h-4 w-20 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-white/5 rounded-lg" />
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-4 w-full bg-white/5 rounded" />
                            <div className="h-4 w-3/4 bg-white/5 rounded" />
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <div className="h-4 w-40 bg-white/5 rounded" />
                        </div>
                        <div className="mt-4 h-10 w-full bg-white/10 rounded-lg" />
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
