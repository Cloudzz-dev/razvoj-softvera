import { GlassCard } from "@/components/ui/GlassCard";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CreateStartupButton } from "@/components/startups/CreateStartupButton";
import { StartupsSearch } from "@/components/startups/StartupsSearch";
import { ConnectButton } from "@/components/startups/ConnectButton";
import Link from "next/link";

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {startups.map((startup) => (
                            <GlassCard key={startup.id} className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center text-2xl">
                                            {startup.logo || "🚀"}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{startup.name}</h3>
                                            <p className="text-sm text-zinc-400">{startup.stage}</p>
                                        </div>
                                    </div>
                                    {startup.websiteUrl && (
                                        <a
                                            href={startup.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4 text-zinc-400" />
                                        </a>
                                    )}
                                </div>

                                <p className="text-zinc-300 mb-4">{startup.pitch}</p>

                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-sm text-zinc-500">
                                        Founded by <span className="text-white font-medium">{startup.founder?.name || "Anonymous"}</span>
                                    </p>
                                </div>

                                <ConnectButton startup={startup} />
                            </GlassCard>
                        ))}
                    </div>

                    {/* Pagination - Simple Next/Prev for now */}
                    <div className="flex justify-center gap-4">
                        {currentPage > 1 && (
                            <Link
                                href={`/dashboard/startups?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                            >
                                Previous
                            </Link>
                        )}
                        {startups.length === 25 && (
                            <Link
                                href={`/dashboard/startups?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
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
