"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Tabs, TabList, TabItem, TabPanels, TabPanel } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { ArrowRight, Rocket, Users, Briefcase, Search, ExternalLink, MapPin, Lock, Terminal, UserPlus } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Input } from "@/components/ui/input";

interface Startup {
    id: string;
    name: string;
    pitch: string;
    stage: string;
    websiteUrl: string | null;
    logo: string | null;
    founder: {
        id: string;
        name: string | null;
    };
}

interface Developer {
    id: string;
    name: string | null;
    email: string;
    role: string;
    profile: {
        bio: string | null;
        location: string | null;
        skills: string[];
    } | null;
}

interface Investor {
    id: string;
    name: string | null;
    profile: {
        bio: string | null;
        location: string | null;
    } | null;
}

type TabType = "startups" | "developers" | "investors";

function DiscoverContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("startups");
    const [searchQuery, setSearchQuery] = useState("");
    const [startups, setStartups] = useState<Startup[]>([]);
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Pagination state
    const [pages, setPages] = useState({
        startups: 1,
        developers: 1,
        investors: 1
    });
    const [hasMore, setHasMore] = useState({
        startups: true,
        developers: true,
        investors: true
    });

    useEffect(() => {
        const tab = searchParams.get("tab") as TabType | null;
        if (tab && ["startups", "developers", "investors"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const fetchData = async (type: TabType, page: number, append = false) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            let url = "";
            if (type === "startups") url = `/api/startups?page=${page}&limit=25`;
            else if (type === "developers") url = `/api/network?role=DEVELOPER&page=${page}&limit=25`;
            else if (type === "investors") url = `/api/network?role=INVESTOR&page=${page}&limit=25`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();

                if (type === "startups") {
                    setStartups(prev => append ? [...prev, ...data] : data);
                    setHasMore(prev => ({ ...prev, startups: data.length === 25 }));
                } else if (type === "developers") {
                    setDevelopers(prev => append ? [...prev, ...data] : data);
                    setHasMore(prev => ({ ...prev, developers: data.length === 25 }));
                } else if (type === "investors") {
                    setInvestors(prev => append ? [...prev, ...data] : data);
                    setHasMore(prev => ({ ...prev, investors: data.length === 25 }));
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${type}:`, error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        // Initial load of first page for all tabs to show counts
        Promise.all([
            fetchData("startups", 1),
            fetchData("developers", 1),
            fetchData("investors", 1)
        ]);
    }, []);

    const handleLoadMore = () => {
        const nextPage = pages[activeTab] + 1;
        setPages(prev => ({ ...prev, [activeTab]: nextPage }));
        fetchData(activeTab, nextPage, true);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        router.push(`/discover?tab=${tab}`);
    };

    // Handle search with PostHog tracking
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Track search when user finishes typing (on blur)
    const handleSearchBlur = () => {
        if (searchQuery.trim()) {
            posthog.capture("discover_search_performed", {
                search_query: searchQuery,
                active_tab: activeTab,
                results_count: activeTab === "startups"
                    ? filteredStartups.length
                    : activeTab === "developers"
                    ? filteredDevelopers.length
                    : filteredInvestors.length,
            });
        }
    };

    const filteredStartups = searchQuery
        ? startups.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.pitch.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : startups;

    const filteredDevelopers = searchQuery
        ? developers.filter(d =>
            d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.profile?.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : developers;

    const filteredInvestors = searchQuery
        ? investors.filter(i =>
            i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.profile?.location?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : investors;

    const tabs = [
        { id: "startups" as TabType, label: "Startups", icon: Rocket, count: startups.length },
        { id: "developers" as TabType, label: "Developers", icon: Users, count: developers.length },
        { id: "investors" as TabType, label: "Investors", icon: Briefcase, count: investors.length },
    ];

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative pt-24 pb-12 overflow-hidden">
                <div className="absolute inset-0 z-0" aria-hidden="true">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
                </div>

                <div className="container relative z-10 px-4 md:px-6 mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-4"
                    >
                        Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">DFDS.io</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8"
                    >
                        Browse startups, developers, and investors. Sign up to connect with them.
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-xl mx-auto mb-8"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500 z-10" />
                            <Input
                                type="text"
                                placeholder="Search startups, developers, or investors..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onBlur={handleSearchBlur}
                                className="pl-12 py-6"
                            />
                        </div>
                    </motion.div>

                    {/* Tabs Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center mb-8"
                    >
                        <Tabs
                            selectedIndex={tabs.findIndex(t => t.id === activeTab)}
                            onChange={(index) => handleTabChange(tabs[index].id)}
                            className="w-full max-w-md"
                        >
                            <TabList>
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <TabItem key={tab.id}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                <span>{tab.label}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">
                                                    {tab.count}
                                                </span>
                                            </div>
                                        </TabItem>
                                    );
                                })}
                            </TabList>
                        </Tabs>
                    </motion.div>
                </div>
            </section>

            {/* Content Section */}
            <section className="container px-4 md:px-6 mx-auto pb-24">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <GlassCard key={i} className="p-6 border-white/10 bg-black/40 rounded-3xl">
                                <div className="animate-pulse">
                                    <div className="h-12 w-12 bg-white/10 rounded-xl mb-4" />
                                    <div className="h-6 bg-white/10 rounded mb-2" />
                                    <div className="h-4 bg-white/10 rounded w-2/3" />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                ) : (
                    <Tabs
                        selectedIndex={tabs.findIndex(t => t.id === activeTab)}
                        onChange={(index) => handleTabChange(tabs[index].id)}
                    >
                        <TabPanels>
                            {/* Startups Tab */}
                            <TabPanel>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredStartups.length === 0 ? (
                                        <div className="col-span-full text-center py-12 text-zinc-400">
                                            No startups found. Try a different search.
                                        </div>
                                    ) : (
                                        filteredStartups.map((startup) => (
                                            <GlassCard key={startup.id} className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all rounded-3xl group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                            {startup.logo || <Rocket className="w-6 h-6 text-indigo-400" />}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white">{startup.name}</h3>
                                                            <p className="text-sm text-indigo-400">{startup.stage}</p>
                                                        </div>
                                                    </div>
                                                    {startup.websiteUrl && (
                                                        <a
                                                            href={startup.websiteUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-zinc-400" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-zinc-300 mb-4 line-clamp-2">{startup.pitch}</p>
                                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar name={startup.founder?.name || "Anonymous"} role="FOUNDER" size="sm" />
                                                        <Link
                                                            href={`/profile/${startup.founder?.id}`}
                                                            className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors"
                                                        >
                                                            {startup.founder?.name || "Anonymous"}
                                                        </Link>
                                                    </div>
                                                    <Link
                                                        href="/join"
                                                        className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                                    >
                                                        <Lock className="w-3 h-3" />
                                                        Connect
                                                    </Link>
                                                </div>
                                            </GlassCard>
                                        ))
                                    )}
                                </div>
                            </TabPanel>

                            {/* Developers Tab */}
                            <TabPanel>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredDevelopers.length === 0 ? (
                                        <div className="col-span-full text-center py-12 text-zinc-400">
                                            No developers found. Try a different search.
                                        </div>
                                    ) : (
                                        filteredDevelopers.map((developer) => (
                                            <Link key={developer.id} href={`/profile/${developer.id}`}>
                                                <GlassCard className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all cursor-pointer h-full rounded-3xl group">
                                                    <div className="text-center mb-4">
                                                        <div className="mx-auto mb-3 flex justify-center group-hover:scale-105 transition-transform">
                                                            <Avatar name={developer.name || "Anonymous"} role="DEVELOPER" size="lg" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white mb-1">{developer.name || "Anonymous"}</h3>
                                                        <p className="text-sm text-indigo-400 font-medium mb-2">Developer</p>
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                                            <span className="text-xs text-green-400 font-medium">Available</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4 justify-center">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{developer.profile?.location || "Remote"}</span>
                                                    </div>

                                                    {developer.profile?.skills && developer.profile.skills.length > 0 && (
                                                        <div className="mb-6">
                                                            <div className="flex flex-wrap justify-center gap-2">
                                                                {developer.profile.skills.slice(0, 3).map((skill) => (
                                                                    <span
                                                                        key={skill}
                                                                        className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-zinc-400 border border-white/5"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-600/30 transition-colors text-sm">
                                                        <Terminal className="w-4 h-4" />
                                                        View Profile
                                                    </div>
                                                </GlassCard>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </TabPanel>

                            {/* Investors Tab */}
                            <TabPanel>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredInvestors.length === 0 ? (
                                        <div className="col-span-full text-center py-12 text-zinc-400">
                                            No investors found. Try a different search.
                                        </div>
                                    ) : (
                                        filteredInvestors.map((investor) => (
                                            <Link key={investor.id} href={`/profile/${investor.id}`}>
                                                <GlassCard className="p-6 border-white/10 bg-black/40 hover:bg-white/5 transition-all cursor-pointer h-full rounded-3xl group">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <div className="group-hover:scale-105 transition-transform">
                                                            <Avatar name={investor.name || "Anonymous"} role="INVESTOR" size="lg" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{investor.name || "Anonymous"}</h3>
                                                            <p className="text-sm text-indigo-400 font-medium mb-1">Investor</p>
                                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                                <MapPin className="w-3 h-3" />
                                                                <span>{investor.profile?.location || "Location Private"}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {investor.profile?.bio && (
                                                        <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">{investor.profile.bio}</p>
                                                    )}

                                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white group-hover:bg-white/10 transition-colors text-sm">
                                                        <UserPlus className="w-4 h-4" />
                                                        Connect
                                                    </div>
                                                </GlassCard>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                )}

                {/* Load More Button */}
                {!loading && hasMore[activeTab] && (
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load More"
                            )}
                        </button>
                    </div>
                )}

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <GlassCard className="max-w-2xl mx-auto p-8 border-white/10 bg-gradient-to-br from-indigo-600/10 to-purple-600/10">
                        <h2 className="text-2xl font-bold text-white mb-3">Ready to join the network?</h2>
                        <p className="text-zinc-400 mb-6">
                            Sign up to connect with startups, developers, and investors. Build the future together.
                        </p>
                        <Link
                            href="/join"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                        >
                            Join DFDS.io <ArrowRight className="w-4 h-4" />
                        </Link>
                    </GlassCard>
                </motion.div>
            </section>

            {/* Simple Footer */}
            <footer className="border-t border-white/10 py-8">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} DFDS.io. All rights reserved.</p>
                    <div className="flex gap-6 text-sm text-zinc-400">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/about" className="hover:text-white transition-colors">About</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export default function DiscoverPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-zinc-400">Loading...</div>
            </div>
        }>
            <DiscoverContent />
        </Suspense>
    );
}
