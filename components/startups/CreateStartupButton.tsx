"use client";

import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
            <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-full"
            >
                <Users className="w-4 h-4" />
                Create Startup
            </Button>

            <Dialog
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Startup"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Startup Name</label>
                        <Input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. NextGen AI"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">One-Liner Pitch</label>
                        <textarea
                            required
                            value={formData.pitch}
                            onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                            className="w-full px-4 py-2 rounded-2xl bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                            placeholder="Describe your startup in one sentence..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Select
                                label="Stage"
                                value={formData.stage}
                                onChange={(value) => setFormData({ ...formData, stage: value })}
                                options={["Idea", "MVP", "Pre-Seed", "Seed", "Series A"]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Team Size</label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.teamSize}
                                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Website URL (Optional)</label>
                        <Input
                            type="url"
                            value={formData.websiteUrl}
                            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                            placeholder="https://"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowCreateModal(false)}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating}
                            className="rounded-full"
                        >
                            {creating ? "Creating..." : "Create Startup"}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </>
    );
}
