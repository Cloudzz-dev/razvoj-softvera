"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import {
    ArrowLeft,
    MapPin,
    Github,
    Linkedin,
    Twitter,
    Globe,
    Users,
    ExternalLink,
    Lock,
    Briefcase,
    Clock,
    DollarSign,
} from "lucide-react";
import posthog from "posthog-js";

interface Project {
    id: string;
    name: string;
    description: string | null;
    url: string | null;
    githubUrl: string | null;
    imageUrl: string | null;
    techStack: string[];
    featured: boolean;
}

interface Startup {
    id: string;
    name: string;
    pitch: string;
    stage: string;
    logo: string | null;
}

interface Profile {
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
    skills: string[];
    githubUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    websiteUrl: string | null;
    experience: string | null;
    availability: string | null;
    rate: string | null;
    firm: string | null;
    checkSize: string | null;
    portfolio: number | null;
    focus: string | null;
    projects: Project[];
}

interface UserProfile {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    createdAt: string;
    profile: Profile | null;
    startups: Startup[];
    _count: {
        followers: number;
        following: number;
    };
}

export default function ProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/profiles/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    // Track profile view on successful load
                    posthog.capture("profile_viewed", {
                        profile_id: userId,
                        profile_role: data.role,
                        profile_name: data.name || "Anonymous",
                        has_bio: !!data.profile?.bio,
                        followers_count: data._count?.followers || 0,
                    });
                } else {
                    setError("Profile not found");
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        }
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "DEVELOPER":
                return "Developer";
            case "FOUNDER":
                return "Founder";
            case "INVESTOR":
                return "Investor";
            default:
                return role;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "DEVELOPER":
                return "👨‍💻";
            case "FOUNDER":
                return "🚀";
            case "INVESTOR":
                return "👨‍💼";
            default:
                return "👤";
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="container px-4 md:px-6 mx-auto py-24">
                    <div className="animate-pulse space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white/10 rounded-full" />
                            <div className="space-y-3">
                                <div className="h-8 bg-white/10 rounded w-48" />
                                <div className="h-4 bg-white/10 rounded w-32" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !user) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <GlassCard className="p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
                    <p className="text-zinc-400 mb-6">{error || "This profile doesn't exist or has been removed."}</p>
                    <Link
                        href="/discover"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Discover
                    </Link>
                </GlassCard>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Background */}
            <div className="fixed inset-0 z-0" aria-hidden="true">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 mx-auto py-12">
                {/* Back Link */}
                <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Discover
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Profile Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <GlassCard className="p-8 border-white/10 bg-black/40">
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    {/* Avatar */}
                                    <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center text-4xl shrink-0">
                                        {user.profile?.avatarUrl || user.image ? (
                                            <img
                                                src={user.profile?.avatarUrl || user.image || ""}
                                                alt={user.name || "User"}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getRoleIcon(user.role)
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-white mb-2">
                                            {user.name || "Anonymous"}
                                        </h1>
                                        <p className="text-lg text-indigo-400 font-medium mb-3">
                                            {getRoleLabel(user.role)}
                                        </p>

                                        {user.profile?.location && (
                                            <div className="flex items-center gap-2 text-zinc-400 mb-4">
                                                <MapPin className="w-4 h-4" />
                                                <span>{user.profile.location}</span>
                                            </div>
                                        )}

                                        {/* Social Links */}
                                        <div className="flex gap-3">
                                            {user.profile?.githubUrl && (
                                                <a
                                                    href={user.profile.githubUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <Github className="w-5 h-5 text-zinc-400" />
                                                </a>
                                            )}
                                            {user.profile?.linkedinUrl && (
                                                <a
                                                    href={user.profile.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <Linkedin className="w-5 h-5 text-zinc-400" />
                                                </a>
                                            )}
                                            {user.profile?.twitterUrl && (
                                                <a
                                                    href={user.profile.twitterUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <Twitter className="w-5 h-5 text-zinc-400" />
                                                </a>
                                            )}
                                            {user.profile?.websiteUrl && (
                                                <a
                                                    href={user.profile.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <Globe className="w-5 h-5 text-zinc-400" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex gap-6 mt-4 md:mt-0">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-white">{user._count.followers}</p>
                                            <p className="text-sm text-zinc-400">Followers</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-white">{user._count.following}</p>
                                            <p className="text-sm text-zinc-400">Following</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                {user.profile?.bio && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <h3 className="text-sm font-medium text-zinc-400 mb-2">About</h3>
                                        <p className="text-zinc-300">{user.profile.bio}</p>
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>

                        {/* Developer Info */}
                        {user.role === "DEVELOPER" && user.profile && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <GlassCard className="p-6 border-white/10 bg-black/40">
                                    <h2 className="text-xl font-semibold text-white mb-4">Developer Info</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {user.profile.experience && (
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                                                <Clock className="w-5 h-5 text-indigo-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">Experience</p>
                                                    <p className="font-medium text-white">{user.profile.experience}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user.profile.availability && (
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                                                <Users className="w-5 h-5 text-green-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">Availability</p>
                                                    <p className="font-medium text-white">{user.profile.availability}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user.profile.rate && (
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                                                <DollarSign className="w-5 h-5 text-yellow-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">Rate</p>
                                                    <p className="font-medium text-white">{user.profile.rate}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Investor Info */}
                        {user.role === "INVESTOR" && user.profile && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <GlassCard className="p-6 border-white/10 bg-black/40">
                                    <h2 className="text-xl font-semibold text-white mb-4">Investor Info</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user.profile.firm && (
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                                                <Briefcase className="w-5 h-5 text-indigo-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">Firm</p>
                                                    <p className="font-medium text-white">{user.profile.firm}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user.profile.checkSize && (
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                                                <DollarSign className="w-5 h-5 text-green-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">Check Size</p>
                                                    <p className="font-medium text-white">{user.profile.checkSize}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user.profile.focus && (
                                            <div className="col-span-full p-4 rounded-lg bg-white/5">
                                                <p className="text-sm text-zinc-400 mb-1">Investment Focus</p>
                                                <p className="font-medium text-white">{user.profile.focus}</p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Projects */}
                        {user.profile?.projects && user.profile.projects.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-xl font-semibold text-white mb-4">Projects</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.profile.projects.map((project) => (
                                        <GlassCard key={project.id} className="p-6 border-white/10 bg-black/40">
                                            {project.imageUrl && (
                                                <div className="mb-4 rounded-lg overflow-hidden">
                                                    <img
                                                        src={project.imageUrl}
                                                        alt={project.name}
                                                        className="w-full h-32 object-cover"
                                                    />
                                                </div>
                                            )}
                                            <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                                            {project.description && (
                                                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{project.description}</p>
                                            )}
                                            {project.techStack.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {project.techStack.map((tech) => (
                                                        <span
                                                            key={tech}
                                                            className="px-2 py-1 rounded-md bg-white/5 text-xs text-zinc-300"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                {project.url && (
                                                    <a
                                                        href={project.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Live
                                                    </a>
                                                )}
                                                {project.githubUrl && (
                                                    <a
                                                        href={project.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
                                                    >
                                                        <Github className="w-4 h-4" />
                                                        Code
                                                    </a>
                                                )}
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Startups */}
                        {user.startups && user.startups.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-xl font-semibold text-white mb-4">Startups</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.startups.map((startup) => (
                                        <GlassCard key={startup.id} className="p-6 border-white/10 bg-black/40">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-xl">
                                                    {startup.logo || "🚀"}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{startup.name}</h3>
                                                    <p className="text-sm text-indigo-400">{startup.stage}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-400 line-clamp-2">{startup.pitch}</p>
                                        </GlassCard>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Skills */}
                        {user.profile?.skills && user.profile.skills.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <GlassCard className="p-6 border-white/10 bg-black/40">
                                    <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.profile.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Connect CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-indigo-600/10 to-purple-600/10">
                                <h3 className="text-lg font-semibold text-white mb-2">Want to connect?</h3>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Sign up to message {user.name || "this user"} and start building together.
                                </p>
                                <Link
                                    href="/join"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                                >
                                    <Lock className="w-4 h-4" />
                                    Sign up to connect
                                </Link>
                            </GlassCard>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 relative z-10">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} DFDS.io. All rights reserved.</p>
                    <div className="flex gap-6 text-sm text-zinc-400">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/discover" className="hover:text-white transition-colors">Discover</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
