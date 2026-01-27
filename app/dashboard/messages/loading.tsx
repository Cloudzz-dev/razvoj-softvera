import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="h-[calc(100vh-120px)] animate-pulse">
            <div className="h-8 w-48 bg-white/10 rounded mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-60px)]">
                {/* Inbox Skeleton */}
                <div className="lg:col-span-1 h-full">
                    <GlassCard className="h-full border-white/10 bg-black/40 flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <div className="h-10 bg-white/5 rounded-lg w-full" />
                        </div>
                        <div className="flex-1 p-2 space-y-2 overflow-hidden">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 h-20" />
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Conversation Skeleton */}
                <div className="lg:col-span-2 h-full">
                    <GlassCard className="h-full border-white/10 bg-black/40 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-white/10 rounded" />
                                <div className="h-3 w-20 bg-white/5 rounded" />
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 space-y-4">
                            <div className="flex justify-start">
                                <div className="h-12 w-64 bg-white/5 rounded-2xl rounded-tl-none" />
                            </div>
                            <div className="flex justify-end">
                                <div className="h-12 w-64 bg-indigo-600/20 rounded-2xl rounded-tr-none" />
                            </div>
                            <div className="flex justify-start">
                                <div className="h-20 w-80 bg-white/5 rounded-2xl rounded-tl-none" />
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5">
                            <div className="h-12 bg-white/5 rounded-lg w-full" />
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
