"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Save, Loader2, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import posthog from "posthog-js";
import { signOut } from "next-auth/react";

type Tab = "profile" | "notifications" | "security";

interface UserSettings {
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        role: string;
    };
    profile: {
        bio: string | null;
        location: string | null;
        skills: string[];
        githubUrl: string | null;
        linkedinUrl: string | null;
    } | null;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    // Profile State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");

    // Notifications State
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "DELETE") return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/settings", {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete account");
            }

            const data = await res.json();

            posthog.capture("account_soft_deleted", {
                scheduled_deletion: data.scheduledDeletionAt
            });

            toast.success("Account scheduled for deletion");

            // Sign out and redirect
            await signOut({ callbackUrl: "/" });

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to delete account");
            setIsDeleting(false);
        }
    };

    // Fetch user data on mount
    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/settings");
                if (!res.ok) throw new Error("Failed to fetch settings");

                const data: UserSettings = await res.json();

                setName(data.user.name || "");
                setEmail(data.user.email || "");
                setBio(data.profile?.bio || "");
                setLocation(data.profile?.location || "");
                setGithubUrl(data.profile?.githubUrl || "");
                setLinkedinUrl(data.profile?.linkedinUrl || "");
                setSkills(data.profile?.skills || []);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill("");
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    bio,
                    location,
                    githubUrl: githubUrl || "",
                    linkedinUrl: linkedinUrl || "",
                    skills,
                }),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            // Track settings saved event
            posthog.capture("settings_saved", {
                settings_tab: activeTab,
                has_bio: !!bio,
                has_location: !!location,
                skills_count: skills.length,
                has_github: !!githubUrl,
                has_linkedin: !!linkedinUrl,
            });

            toast.success("Settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save settings");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-zinc-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <p className="text-zinc-400">Manage your account preferences and settings.</p>
            </div>

            <GlassCard variant="dark" className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/10 p-6 flex flex-col">
                    <nav className="space-y-2 flex-1">
                        <Button
                            variant={activeTab === "profile" ? "glass" : "ghost"}
                            onClick={() => setActiveTab("profile")}
                            className="w-full justify-start gap-3 px-4 py-6 rounded-full"
                        >
                            <User className="w-5 h-5" />
                            <span className="font-medium">Profile</span>
                        </Button>
                        <Button
                            variant={activeTab === "notifications" ? "glass" : "ghost"}
                            onClick={() => setActiveTab("notifications")}
                            className="w-full justify-start gap-3 px-4 py-6 rounded-full"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="font-medium">Notifications</span>
                        </Button>
                        <Button
                            variant={activeTab === "security" ? "glass" : "ghost"}
                            onClick={() => setActiveTab("security")}
                            className="w-full justify-start gap-3 px-4 py-6 rounded-full"
                        >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Security</span>
                        </Button>
                    </nav>

                    <div className="pt-6 border-t border-white/10">
                        <p className="text-xs text-zinc-500">DFDS.io v0.1.0</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h3 className="text-xl font-semibold text-white capitalize">{activeTab} Settings</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === "profile" && (
                            <div className="space-y-8 max-w-2xl">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold">
                                        {name.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">{name || "Your Name"}</h4>
                                        <p className="text-sm text-zinc-400 mb-3">{email}</p>
                                        <Button variant="glass" size="sm" className="rounded-full">
                                            Change Avatar
                                        </Button>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
                                            <Input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                                            <Input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                                        <Textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={4}
                                            placeholder="Tell us about yourself..."
                                            className="resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Social Links</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">GitHub URL</label>
                                            <Input
                                                type="url"
                                                value={githubUrl}
                                                onChange={(e) => setGithubUrl(e.target.value)}
                                                placeholder="https://github.com/username"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">LinkedIn URL</label>
                                            <Input
                                                type="url"
                                                value={linkedinUrl}
                                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Skills</h4>
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                                            placeholder="Add a skill..."
                                        />
                                        <Button
                                            onClick={handleAddSkill}
                                            className="rounded-full"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="indigo"
                                                className="gap-2"
                                            >
                                                {skill}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="h-auto p-0 text-zinc-400 hover:text-white hover:bg-transparent"
                                                >
                                                    ×
                                                </Button>
                                            </Badge>
                                        ))}
                                        {skills.length === 0 && (
                                            <p className="text-zinc-500 text-sm">No skills added yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="space-y-4 max-w-xl">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div>
                                        <h4 className="text-white font-medium">Email Notifications</h4>
                                        <p className="text-sm text-zinc-400">Receive updates via email</p>
                                    </div>
                                    <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div>
                                        <h4 className="text-white font-medium">Push Notifications</h4>
                                        <p className="text-sm text-zinc-400">Receive updates in browser</p>
                                    </div>
                                    <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="space-y-6 max-w-xl">
                                <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                    <h4 className="text-yellow-400 font-medium mb-2">Change Password</h4>
                                    <p className="text-sm text-zinc-400 mb-4">Ensure your account is using a long, random password to stay secure.</p>
                                    <Button variant="glass" size="sm" className="rounded-full">
                                        Update Password
                                    </Button>
                                </div>

                                <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                                    <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
                                    <p className="text-sm text-zinc-400 mb-4">Permanently delete your account and all of your content.</p>
                                    <Button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/10 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="gap-2 rounded-full"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </GlassCard>
            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <GlassCard variant="dark" className="max-w-md w-full p-6 space-y-6 border-red-500/20">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 text-red-400">
                                    <div className="p-2 rounded-lg bg-red-500/10">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold">Delete Account</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-zinc-300">
                                    Are you sure you want to delete your account? This action cannot be undone immediately.
                                </p>

                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200">
                                    <strong>Note:</strong> Your data will be kept for 30 days before being permanently removed. You can cancel the deletion by logging back in during this period.
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Type <span className="text-white font-mono">DELETE</span> to confirm
                                    </label>
                                    <Input
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        className="font-mono"
                                        placeholder="DELETE"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="glass"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 rounded-full"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmation !== "DELETE" || isDeleting}
                                    className="flex-1 gap-2 rounded-full bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Delete Account"
                                    )}
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                )
            }
        </div>
    );
}
