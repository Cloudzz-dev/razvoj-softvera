import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CreateStartupButton } from "@/components/startups/CreateStartupButton";
import { StartupsSearch } from "@/components/startups/StartupsSearch";
import { ConnectButton } from "@/components/startups/ConnectButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Server Action to fetch startups (can also be a cached util)
async function getStartups(search?: string, page: number = 1) {
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { pitch: { contains: search, mode: "insensitive" } },
            { stage: { contains: search, mode: "insensitive" } },
            { founder: { name: { contains: search, mode: "insensitive" } } },
        ];
    }

    const startups = await prisma.startup.findMany({
        where,
        include: {
            founder: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        skip,
        take: limit,
    });

    return startups;
}

export default async function StartupsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const { search, page } = await searchParams;
    const currentPage = parseInt(page || "1");
    const startups = await getStartups(search, currentPage);

    const buttonStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98]";
    const glassVariant = "bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 text-white h-10 px-4 py-2";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Browse Startups</h1>
                    <p className="text-zinc-400">
                        Discover innovative startups looking for co-founders and team members
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <StartupsSearch />
                    <CreateStartupButton />
                </div>
            </div>

            {startups.length === 0 ? (
                <GlassCard className="p-12 border-white/10 bg-black/40 text-center">
                    <p className="text-zinc-400">No startups found</p>
                    <p className="text-sm text-zinc-500 mt-2">Be the first to create a startup!</p>
                    <div className="mt-4 flex justify-center">
                        <CreateStartupButton />
                    </div>
                </GlassCard>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {startups.map((startup) => (
                            <GlassCard 
                                key={startup.id} 
                                className="group relative p-3 border-white/10 bg-black/40 hover:bg-white/5 transition-all flex flex-col justify-center text-center overflow-hidden min-h-[180px]"
                            >
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex flex-col items-center gap-0.5 mb-2">
                                        <h3 className="text-sm font-bold text-white tracking-tight truncate w-full px-1">{startup.name}</h3>
                                        <p className="text-[8px] uppercase font-black text-emerald-500 tracking-widest">{startup.stage}</p>
                                    </div>

                                    <p className="text-[10px] text-zinc-500 line-clamp-2 mb-2 px-1 font-medium">{startup.pitch}</p>

                                    <div className="pt-1.5 border-t border-white/5">
                                        <p className="text-[9px] text-white font-bold truncate opacity-60">@{startup.founder?.name?.split(' ')[0] || "anon"}</p>
                                    </div>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black via-black/90 to-transparent">
                                    <ConnectButton startup={startup} />
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Pagination - Simple Next/Prev for now */}
                    <div className="flex justify-center gap-4">
                        {currentPage > 1 && (
                            <Link
                                href={`/dashboard/startups?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
                                className={cn(buttonStyles, glassVariant)}
                            >
                                Previous
                            </Link>
                        )}
                        {startups.length === 25 && (
                            <Link
                                href={`/dashboard/startups?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
                                className={cn(buttonStyles, glassVariant)}
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
