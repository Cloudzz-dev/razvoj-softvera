import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="h-full flex flex-col gap-6 animate-pulse">
            {/* Header Skeleton */}
            <div>
                <div className="h-8 w-48 bg-white/10 rounded mb-2" />
                <div className="h-4 w-96 bg-white/5 rounded" />
            </div>

            {/* Main Content Skeleton */}
            <GlassCard variant="dark" className="flex-1 p-6 border-white/5">
                <div className="space-y-8">
                    <div className="h-7 w-32 bg-white/10 rounded" />

                    <div className="space-y-4">
                        <div className="h-4 w-full bg-white/5 rounded" />
                        <div className="h-4 w-5/6 bg-white/5 rounded" />
                        <div className="h-4 w-4/6 bg-white/5 rounded" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="h-40 bg-white/5 rounded-xl" />
                        <div className="h-40 bg-white/5 rounded-xl" />
                    </div>

                    <div className="h-20 bg-white/5 rounded-xl w-full" />
                </div>
            </GlassCard>
        </div>
    );
}
