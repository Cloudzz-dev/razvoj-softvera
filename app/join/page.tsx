"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { SkillsAutocomplete } from "@/components/ui/SkillsAutocomplete";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Rocket, Users, Briefcase, ArrowLeft, Check, ChevronRight } from "lucide-react";
import { RadioGroup, RadioGroupOption } from "@/components/ui/radio-group";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { motion, AnimatePresence } from "framer-motion";

const roles = [
    {
        id: "DEVELOPER",
        name: "Developer",
        icon: <Users className="w-6 h-6" />,
        description: "Build amazing products with founders",
        color: "indigo"
    },
    {
        id: "FOUNDER",
        name: "Founder",
        icon: <Rocket className="w-6 h-6" />,
        description: "Find co-founders and developers",
        color: "rose"
    },
    {
        id: "INVESTOR",
        name: "Investor",
        icon: <Briefcase className="w-6 h-6" />,
        description: "Discover promising startups",
        color: "emerald"
    },
] as const;

export default function JoinPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1); // 1: Role, 2: Details

    // Common fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [location, setLocation] = useState("");

    // Developer fields
    const [skills, setSkills] = useState<string[]>([]);
    const [experience, setExperience] = useState("");
    const [availability, setAvailability] = useState("Available");
    const [rate, setRate] = useState("");

    // Investor fields
    const [firm, setFirm] = useState("");
    const [checkSize, setCheckSize] = useState("");
    const [focus, setFocus] = useState("");

    // Founder fields
    const [startupName, setStartupName] = useState("");
    const [pitch, setPitch] = useState("");
    const [stage, setStage] = useState("Pre-seed");
    const [websiteUrl, setWebsiteUrl] = useState("");

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId);
        setStep(2);
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setSelectedRole(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Build registration payload based on role
            const payload: any = {
                name,
                email,
                password,
                role: selectedRole,
                location,
            };

            if (selectedRole === "DEVELOPER") {
                payload.skills = skills;
                payload.experience = experience;
                payload.availability = availability;
                payload.rate = rate;
            } else if (selectedRole === "INVESTOR") {
                payload.firm = firm;
                payload.checkSize = checkSize;
                payload.focus = focus;
            } else if (selectedRole === "FOUNDER") {
                payload.startupName = startupName;
                payload.pitch = pitch;
                payload.stage = stage;
                payload.websiteUrl = websiteUrl;
            }

            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();

                // Handle Zod validation errors nicely
                if (data.details) {
                    const firstError = data.details[0];
                    throw new Error(firstError.message || "Validation failed");
                }

                throw new Error(data.error || "Something went wrong");
            }

            // Identify user and track successful signup
            posthog.identify(email, {
                email: email,
                name: name,
                role: selectedRole,
                location: location || undefined,
            });
            posthog.capture("user_signed_up", {
                role: selectedRole,
                has_location: !!location,
                tier: "FREE" // Default tier
            });

            // Redirect to email verification page
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);

        } catch (error: any) {
            setError(error.message);
            // Capture signup error
            posthog.captureException(error instanceof Error ? error : new Error(error.message || "Signup error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[100px]" />
            </div>

            <GlassCard className="w-full max-w-2xl p-0 border-white/10 bg-black/60 relative z-10">
                {/* Progress Bar */}
                <div className="h-1 w-full bg-white/5 rounded-t-2xl overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-500"
                        initial={{ width: "50%" }}
                        animate={{ width: step === 1 ? "50%" : "100%" }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                dfds
                            </span>
                        </Link>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {step === 1 ? "Choose your path" : "Create your account"}
                                </h1>
                                <p className="text-zinc-400">
                                    {step === 1
                                        ? "Join the network of top tech talent and founders"
                                        : `Complete your ${roles.find(r => r.id === selectedRole)?.name.toLowerCase()} profile`
                                    }
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <RadioGroup value={selectedRole || ""} onChange={handleRoleSelect} className="grid grid-cols-1 gap-4">
                                    {roles.map((role) => (
                                        <RadioGroupOption
                                            key={role.id}
                                            value={role.id}
                                            className="flex items-center gap-4 p-4 rounded-3xl group"
                                        >
                                            <div className={`p-3 rounded-lg bg-${role.color}-500/10 text-${role.color}-400 group-hover:scale-110 transition-transform`}>
                                                {role.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                                                    {role.name}
                                                </h3>
                                                <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">{role.description}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                                        </RadioGroupOption>
                                    ))}
                                </RadioGroup>

                                <div className="text-center pt-4 border-t border-white/5">
                                    <p className="text-sm text-zinc-500">
                                        Already have an account?{" "}
                                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 group transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Back to roles
                                </button>

                                <form onSubmit={handleSubmit} className="space-y-6">

                                    {/* Core Info Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Basic Info</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                                                    <Input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required
                                                        placeholder="John Doe"
                                                        autoComplete="name"
                                                        inputMode="text"
                                                    />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                                                    <Input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        placeholder="john@example.com"
                                                        autoComplete="email"
                                                        inputMode="email"
                                                    />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                                                    <Input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        minLength={8}
                                                        placeholder="Min. 8 characters"
                                                        autoComplete="new-password"
                                                    />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                                                <LocationAutocomplete
                                                    value={location}
                                                    onChange={setLocation}
                                                    placeholder="City, Country"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/10 my-6" />

                                    {/* Role Specific Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                                            {roles.find(r => r.id === selectedRole)?.name} Details
                                        </h3>

                                        {selectedRole === "DEVELOPER" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Skills & Technologies</label>
                                                    <SkillsAutocomplete
                                                        value={skills}
                                                        onChange={setSkills}
                                                        placeholder="React, Node.js, Python..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Select
                                                            label="Experience Level"
                                                            value={experience}
                                                            onChange={(value) => setExperience(value)}
                                                            placeholder="Select experience"
                                                            options={[
                                                                "Junior (0-2 years)",
                                                                "Mid (2-5 years)",
                                                                "Senior (5-8 years)",
                                                                "Staff/Principal (8+ years)"
                                                            ]}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Select
                                                            label="Availability"
                                                            value={availability}
                                                            onChange={(value) => setAvailability(value)}
                                                            options={[
                                                                "Available",
                                                                "Part-time",
                                                                "Consulting",
                                                                "Not looking"
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedRole === "INVESTOR" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Firm / Company</label>
                                                    <Input
                                                        type="text"
                                                        value={firm}
                                                        onChange={(e) => setFirm(e.target.value)}
                                                        placeholder="Acme Ventures (Optional)"
                                                        autoComplete="organization"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Select
                                                            label="Check Size"
                                                            value={checkSize}
                                                            onChange={(value) => setCheckSize(value)}
                                                            placeholder="Select range"
                                                            options={[
                                                                { label: "<$50K (Angel)", value: "<$50K" },
                                                                { label: "$50K - $250K", value: "$50K - $250K" },
                                                                { label: "$250K - $1M", value: "$250K - $1M" },
                                                                { label: "$1M+", value: "$1M+" }
                                                            ]}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Primary Focus</label>
                                                        <Input
                                                            type="text"
                                                            value={focus}
                                                            onChange={(e) => setFocus(e.target.value)}
                                                            placeholder="e.g. SaaS, Fintech, AI"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedRole === "FOUNDER" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Startup Name</label>
                                                    <Input
                                                        type="text"
                                                        value={startupName}
                                                        onChange={(e) => setStartupName(e.target.value)}
                                                        required
                                                        placeholder="Your Startup Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Elevator Pitch</label>
                                                    <Textarea
                                                        value={pitch}
                                                        onChange={(e) => setPitch(e.target.value)}
                                                        required
                                                        rows={3}
                                                        placeholder="Describe your startup in 1-2 sentences. What problem do you solve?"
                                                    />
                                                    <p className="text-xs text-zinc-500 mt-1 text-right">{pitch.length} chars (min 50)</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Select
                                                            label="Current Stage"
                                                            value={stage}
                                                            onChange={(value) => setStage(value)}
                                                            options={[
                                                                { label: "Idea Phase", value: "Idea" },
                                                                { label: "MVP / Prototype", value: "MVP" },
                                                                { label: "Pre-seed", value: "Pre-seed" },
                                                                { label: "Seed", value: "Seed" },
                                                                { label: "Series A+", value: "Series A+" }
                                                            ]}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                                                        <Input
                                                            type="url"
                                                            value={websiteUrl}
                                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                                            placeholder="https://"
                                                            inputMode="url"
                                                            autoComplete="url"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3 text-red-200 text-sm"
                                        >
                                            <div className="w-1 h-full bg-red-500 rounded-full" />
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full px-6 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold hover:from-indigo-500 hover:to-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating Profile...
                                            </>
                                        ) : (
                                            <>
                                                Create Account <Check className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </GlassCard>
        </div>
    );
}

