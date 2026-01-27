import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="h-full flex flex-col gap-6 animate-pulse">
            <div>
                <div className="h-8 w-48 bg-white/10 rounded mb-2" />
                <div className="h-4 w-96 bg-white/5 rounded" />
            </div>

            <GlassCard variant="dark" className="flex-1 flex overflow-hidden border-white/5">
                {/* Sidebar Skeleton */}
                <div className="w-64 border-r border-white/10 p-6 flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 w-full bg-white/5 rounded-full" />
                    ))}
                    <div className="mt-auto h-4 w-24 bg-white/5 rounded" />
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <div className="h-7 w-32 bg-white/10 rounded" />
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                            <div className="w-24 h-24 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-white/10 rounded" />
                                <div className="h-4 w-48 bg-white/5 rounded" />
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-10 bg-white/5 rounded" />
                            <div className="h-10 bg-white/5 rounded" />
                        </div>
                        <div className="h-24 bg-white/5 rounded" />
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
