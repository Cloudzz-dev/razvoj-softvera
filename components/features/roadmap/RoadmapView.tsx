"use client";

import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSession } from "next-auth/react";
import { Plus, ThumbsUp, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    status: "PLANNED" | "IN_PROGRESS" | "DONE";
    votes: number;
    hasVoted: boolean;
    user: {
        name: string | null;
        image: string | null;
    };
    createdAt: string;
}

interface RoadmapViewProps {
    readOnly?: boolean;
}

export function RoadmapView({ readOnly = false }: RoadmapViewProps) {
    const { data: session } = useSession();
    const [features, setFeatures] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // New Feature Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const fetchFeatures = async () => {
        try {
            const res = await fetch("/api/roadmap");
            if (res.ok) {
                const data = await res.json();
                setFeatures(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load roadmap");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    const handleVote = async (id: string, currentVoted: boolean) => {
        if (!session) {
            toast.error("Please login to vote");
            return;
        }

        try {
            // Optimistic update
            setFeatures((prev) =>
                prev.map((f) =>
                    f.id === id
                        ? {
                            ...f,
                            votes: currentVoted ? f.votes - 1 : f.votes + 1,
                            hasVoted: !currentVoted,
                        }
                        : f
                )
            );

            const res = await fetch("/api/roadmap/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featureId: id }),
            });

            if (!res.ok) throw new Error("Vote failed");
        } catch {
            toast.error("Something went wrong");
            fetchFeatures(); // Revert on error
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) return;

        try {
            const res = await fetch("/api/roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (res.ok) {
                toast.success("Feature request submitted!");
                setTitle("");
                setDescription("");
                setIsCreating(false);
                fetchFeatures();
            } else {
                toast.error("Failed to submit");
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    // Admin Helper
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        setFeatures((prev) =>
            prev.map((f) =>
                f.id === id ? { ...f, status: newStatus as any } : f
            )
        );

        try {
            const res = await fetch("/api/roadmap", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featureId: id, status: newStatus }),
            });

            if (!res.ok) throw new Error("Update failed");
            toast.success("Status updated");
        } catch {
            toast.error("Failed to update status");
            fetchFeatures(); // Revert
        }
    };

    const statusColors = {
        PLANNED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        DONE: "bg-green-500/10 text-green-400 border-green-500/20",
    };

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Roadmap
                    </h1>
                    <p className="text-white/60 mt-2">
                        Vote on features you want to see next.
                    </p>
                </div>
                {!readOnly && session && (
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Submit Idea
                    </button>
                )}
            </div>

            {isCreating && !readOnly && (
                <GlassCard className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">New Feature Request</h3>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="e.g. Dark Mode"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                                placeholder="Describe your idea..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 rounded-lg hover:bg-white/5 text-white/60 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </GlassCard>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-white/40">No feature requests yet. Be the first!</p>
                        </div>
                    ) : (
                        features.map((feature) => (
                            <GlassCard key={feature.id} className="flex flex-col h-full group">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    {isAdmin && !readOnly ? (
                                        <select
                                            value={feature.status}
                                            onChange={(e) => handleStatusChange(feature.id, e.target.value)}
                                            className={`px-2 py-1 rounded text-xs font-medium border bg-transparent cursor-pointer outline-none appearance-none ${statusColors[feature.status] || "bg-white/5 text-white/60 border-white/10"
                                                }`}
                                        >
                                            <option value="PLANNED" className="bg-black text-blue-400">PLANNED</option>
                                            <option value="IN_PROGRESS" className="bg-black text-amber-400">IN PROGRESS</option>
                                            <option value="DONE" className="bg-black text-green-400">DONE</option>
                                        </select>
                                    ) : (
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[feature.status] || "bg-white/5 text-white/60 border-white/10"
                                                }`}
                                        >
                                            {feature.status.replace("_", " ")}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleVote(feature.id, feature.hasVoted)}
                                        // Disable voting if readOnly (optional, but requested behavior implies readOnly means display requests mostly) 
                                        // Actually user said only submit function should not be there. Voting might still be allowed if logged in? 
                                        // "link thats in the footer shoudlnt have a submit function but only display the current reqests"
                                        // I will assume voting is part of "interacting" so maybe disable it too if purely read-only display.
                                        // But if user is logged in they can access dashboard version.
                                        // Let's keep voting enabled if user is logged in, but just hide the submit button as requested.
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${feature.hasVoted
                                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                            : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
                                            }`}
                                    >
                                        <ThumbsUp className={`w-3.5 h-3.5 ${feature.hasVoted ? "fill-current" : ""}`} />
                                        <span className="text-sm font-medium">{feature.votes}</span>
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/60 text-sm mb-6 flex-grow whitespace-pre-wrap">
                                    {feature.description}
                                </p>

                                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                    {feature.user.image ? (
                                        <img
                                            src={feature.user.image}
                                            alt={feature.user.name || "User"}
                                            className="w-6 h-6 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-medium">
                                            {feature.user.name?.[0] || "?"}
                                        </div>
                                    )}
                                    <span className="text-xs text-white/40">
                                        Requested by <span className="text-white/60">{feature.user.name || "Anonymous"}</span>
                                    </span>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
