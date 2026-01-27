import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 w-64 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-96 bg-white/5 rounded" />
                </div>
                <div className="h-10 w-64 bg-white/5 rounded-lg" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <GlassCard key={i} className="p-6 border-white/10 bg-black/40">
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-16 h-16 bg-white/10 rounded-full mb-3" />
                            <div className="h-5 bg-white/10 rounded w-24 mb-2" />
                            <div className="h-4 bg-white/10 rounded w-32" />
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-3 bg-white/5 rounded w-3/4" />
                        </div>
                        <div className="h-10 bg-white/10 rounded-lg mt-4" />
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
