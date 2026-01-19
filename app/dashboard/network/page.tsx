import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NetworkGrid } from "@/components/dashboard/NetworkGrid";
import { NetworkSearch } from "@/components/dashboard/NetworkSearch";

interface NetworkPageProps {
    searchParams: Promise<{ search?: string }>;
}

// Loading skeleton for network grid
function NetworkLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <GlassCard key={i} className="p-6 border-white/10 bg-black/40">
                    <div className="animate-pulse">
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-16 h-16 bg-white/10 rounded-full mb-3" />
                            <div className="h-5 bg-white/10 rounded w-24 mb-2" />
                            <div className="h-4 bg-white/10 rounded w-32" />
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-3 bg-white/5 rounded w-3/4" />
                        </div>
                        <div className="h-10 bg-white/10 rounded-lg" />
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}

// Server-side data fetching
async function getNetworkUsers(userId: string, userEmail: string, search?: string) {
    const LIMIT = 25;

    const where: any = {
        role: "DEVELOPER",
        email: { not: userEmail },
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const users = await prisma.user.findMany({
        where,
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
        },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
    });

    return {
        users,
        hasMore: users.length === LIMIT,
    };
}

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    const params = await searchParams;
    const search = params.search;

    const { users, hasMore } = await getNetworkUsers(
        session.user.id,
        session.user.email,
        search
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Developer Network</h1>
                    <p className="text-zinc-400">
                        Find talented developers to join your team
                    </p>
                </div>
                <Suspense fallback={<div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />}>
                    <NetworkSearch initialSearch={search} />
                </Suspense>
            </div>

            {/* Network Grid - Server-rendered initial data, client handles interactions */}
            <Suspense fallback={<NetworkLoadingSkeleton />}>
                <NetworkGrid
                    initialUsers={users}
                    searchQuery={search}
                    initialHasMore={hasMore}
                />
            </Suspense>
        </div>
    );
}
