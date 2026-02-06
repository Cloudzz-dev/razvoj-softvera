import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { InvestorGrid } from "@/components/dashboard/InvestorGrid";
import { NetworkSearch } from "@/components/dashboard/NetworkSearch";

interface InvestorsPageProps {
    searchParams: Promise<{ search?: string }>;
}

// Loading skeleton
function InvestorLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <GlassCard key={i} className="p-6 border-white/10 bg-black/40">
                    <div className="animate-pulse">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 bg-white/10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-6 bg-white/10 rounded w-3/4" />
                                <div className="h-4 bg-white/10 rounded w-1/2" />
                            </div>
                        </div>
                        <div className="h-10 bg-white/10 rounded-lg mt-4" />
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}

// Server-side data fetching
async function getInvestors(userId: string, userEmail: string, search?: string, cursor?: string) {
    const LIMIT = 25;

    const where: any = {
        role: "INVESTOR",
        email: { not: userEmail },
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const investors = await prisma.user.findMany({
        where,
        take: LIMIT,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
                select: {
                    bio: true,
                    location: true,
                    skills: true,
                },
            },
            _count: {
                select: {
                    startups: true,
                    followers: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const nextCursor = investors.length === LIMIT ? investors[investors.length - 1].id : undefined;

    return {
        investors,
        nextCursor,
    };
}

export default async function InvestorsPage({ searchParams }: InvestorsPageProps) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    const params = await searchParams;
    const search = params.search;

    const { investors, nextCursor } = await getInvestors(
        session.user.id,
        session.user.email,
        search
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Connect with Investors</h1>
                    <p className="text-zinc-400">
                        Find investors who are interested in your industry and stage
                    </p>
                </div>
                <Suspense fallback={<div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />}>
                    <NetworkSearch initialSearch={search} />
                </Suspense>
            </div>

            {/* Investor Grid */}
            <Suspense fallback={<InvestorLoadingSkeleton />}>
                <InvestorGrid
                    initialInvestors={investors}
                    searchQuery={search}
                    initialNextCursor={nextCursor}
                />
            </Suspense>
        </div>
    );
}
