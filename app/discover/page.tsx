"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Tabs, TabList, TabItem, TabPanels, TabPanel } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

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
        <PageShell>
            <Section className="pt-12 md:pt-20">
                <div className="text-center space-y-6 max-w-4xl mx-auto mb-16">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                        Discover
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Explore the next generation of visionary startups and top-tier talent in the DFDS ecosystem.
                    </p>

                    <div className="max-w-2xl mx-auto pt-8">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <Input
                                type="text"
                                placeholder="Search by name, skills, or mission..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onBlur={handleSearchBlur}
                                className="pl-14 h-16 rounded-2xl bg-white/5 border-white/10 focus:border-white/20 text-lg shadow-2xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mb-12">
                    <div className="bg-white/5 p-1.5 rounded-full border border-white/10 flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${isActive ? "bg-white text-black shadow-xl" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-black/10" : "bg-white/10"}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 rounded-3xl border border-white/10 bg-black/40 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="min-h-[40vh]">
                        {activeTab === "startups" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {filteredStartups.length === 0 ? (
                                    <div className="col-span-full py-20 text-center">
                                        <p className="text-zinc-500 text-lg font-medium">No startups found matching your search.</p>
                                    </div>
                                ) : (
                                    filteredStartups.map((startup) => (
                                        <GlassCard key={startup.id} className="p-8 border-white/10 bg-black/40 hover:bg-white/5 transition-all group flex flex-col h-full">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-xl">
                                                    {startup.logo || <Rocket className="w-8 h-8 text-indigo-400" />}
                                                </div>
                                                {startup.websiteUrl && (
                                                    <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all">
                                                        <ExternalLink className="w-5 h-5" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-2xl font-bold text-white tracking-tight">{startup.name}</h3>
                                                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">{startup.stage}</span>
                                                </div>
                                                <p className="text-zinc-400 leading-relaxed line-clamp-3">{startup.pitch}</p>
                                            </div>
                                            <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between">
                                                <Link href={`/profile/${startup.founder?.id}`} className="flex items-center gap-3 group/founder">
                                                    <Avatar name={startup.founder?.name || "Anonymous"} role="FOUNDER" size="sm" />
                                                    <span className="text-sm font-bold text-zinc-500 group-hover/founder:text-white transition-colors">{startup.founder?.name || "Founder"}</span>
                                                </Link>
                                                <Link href="/join" className="flex items-center gap-1.5 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                                    <Lock className="w-3.5 h-3.5" /> Connect
                                                </Link>
                                            </div>
                                        </GlassCard>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "developers" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {filteredDevelopers.map((developer) => (
                                    <Link key={developer.id} href={`/profile/${developer.id}`}>
                                        <GlassCard className="p-8 border-white/10 bg-black/40 hover:bg-white/5 transition-all text-center space-y-6 h-full group">
                                            <div className="relative mx-auto w-24 h-24">
                                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
                                                <Avatar name={developer.name || "Anonymous"} role="DEVELOPER" size="lg" className="relative z-10 border-4 border-black group-hover:scale-105 transition-transform" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{developer.name || "Developer"}</h3>
                                                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    Available
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-sm">
                                                <MapPin size={14} />
                                                <span>{developer.profile?.location || "Remote"}</span>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {developer.profile?.skills?.slice(0, 2).map(skill => (
                                                    <span key={skill} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="pt-4">
                                                <div className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold group-hover:bg-white group-hover:text-black transition-all flex items-center justify-center gap-2">
                                                    <Terminal size={14} /> View Profile
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {activeTab === "investors" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {filteredInvestors.map((investor) => (
                                    <Link key={investor.id} href={`/profile/${investor.id}`}>
                                        <GlassCard className="p-8 border-white/10 bg-black/40 hover:bg-white/5 transition-all h-full group">
                                            <div className="flex items-center gap-6 mb-8">
                                                <Avatar name={investor.name || "Anonymous"} role="INVESTOR" size="lg" className="group-hover:scale-110 transition-transform" />
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">{investor.name || "Investor"}</h3>
                                                    <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                                                        <MapPin size={14} />
                                                        <span>{investor.profile?.location || "Private"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 leading-relaxed mb-8 line-clamp-3">
                                                {investor.profile?.bio || "Connect to view detailed investment focus and portfolio information."}
                                            </p>
                                            <div className="w-full py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                                <UserPlus size={16} /> Request Connection
                                            </div>
                                        </GlassCard>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!loading && hasMore[activeTab] && (
                    <div className="mt-16 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Explore More"
                            )}
                        </button>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-32 max-w-4xl mx-auto"
                >
                    <GlassCard className="p-12 border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent text-center space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Build the future with us.</h2>
                            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                                Join the world&apos;s most ambitious network of founders and builders.
                            </p>
                        </div>
                        <Link
                            href="/join"
                            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all transform hover:scale-105"
                        >
                            Get Started Now <ArrowRight className="w-5 h-5" />
                        </Link>
                    </GlassCard>
                </motion.div>
            </Section>
        </PageShell>
    );
}

export default function DiscoverPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Initializing Ecosystem...</div>
            </div>
        }>
            <DiscoverContent />
        </Suspense>
    );
}
