"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Users, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import posthog from "posthog-js";
import { useSession } from "next-auth/react";

export function CreateStartupButton() {
    const router = useRouter();
    const { update } = useSession();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        pitch: "",
        stage: "Idea",
        websiteUrl: "",
        logo: "🚀",
        raised: "",
        teamSize: "1",
    });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/startups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const newStartup = await res.json();
                setShowCreateModal(false);

                // Track startup creation
                posthog.capture("startup_created", {
                    startup_id: newStartup.id,
                    startup_name: formData.name,
                    startup_stage: formData.stage,
                    has_website: !!formData.websiteUrl,
                    team_size: parseInt(formData.teamSize) || 1,
                });

                setFormData({
                    name: "",
                    pitch: "",
                    stage: "Idea",
                    websiteUrl: "",
                    logo: "🚀",
                    raised: "",
                    teamSize: "1",
                });

                toast.success("Startup created successfully!");
                await update(); // Force session refresh to update role to FOUNDER
                router.refresh();
            } else {
                toast.error("Failed to create startup");
            }
        } catch (error) {
            console.error("Error creating startup:", error);
            posthog.captureException(error instanceof Error ? error : new Error("Startup creation error"));
            toast.error("Something went wrong");
        } finally {
            setCreating(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
                <Users className="w-4 h-4" />
                Create Startup
            </button>

            {/* Create Startup Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-lg p-6 border-white/10 bg-black/90 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create New Startup</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Startup Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. NextGen AI"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">One-Liner Pitch</label>
                                <textarea
                                    required
                                    value={formData.pitch}
                                    onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                    placeholder="Describe your startup in one sentence..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Stage</label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option>Idea</option>
                                        <option>MVP</option>
                                        <option>Pre-Seed</option>
                                        <option>Seed</option>
                                        <option>Series A</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Team Size</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.teamSize}
                                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Website URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-lg text-zinc-400 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create Startup"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </>
    );
}
