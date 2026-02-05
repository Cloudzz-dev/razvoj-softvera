"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
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
    const [step, setStep] = useState(1);

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
                if (data.details) {
                    const firstError = data.details[0];
                    throw new Error(firstError.message || "Validation failed");
                }
                throw new Error(data.error || "Something went wrong");
            }

            posthog.identify(email, {
                email: email,
                name: name,
                role: selectedRole,
                location: location || undefined,
            });
            posthog.capture("user_signed_up", {
                role: selectedRole,
                has_location: !!location,
                tier: "FREE"
            });

            router.push(`/verify-email?email=${encodeURIComponent(email)}`);

        } catch (error: any) {
            setError(error.message);
            posthog.captureException(error instanceof Error ? error : new Error(error.message || "Signup error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageShell footer={false}>
            <Section className="flex items-center justify-center min-h-[85vh]">
                <GlassCard className="w-full max-w-2xl p-0 border-white/10 bg-black/40 backdrop-blur-xl relative z-10 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            initial={{ width: "33%" }}
                            animate={{ width: step === 1 ? "33%" : "100%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="text-center mb-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                                        {step === 1 ? "Choose your path" : "Create your account"}
                                    </h1>
                                    <p className="text-zinc-400 text-lg">
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
                                                className="flex items-center gap-6 p-6 rounded-3xl group border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
                                            >
                                                <div className={`p-4 rounded-2xl bg-white/5 text-white group-hover:scale-110 transition-transform`}>
                                                    {role.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                                                        {role.name}
                                                    </h3>
                                                    <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">{role.description}</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
                                            </RadioGroupOption>
                                        ))}
                                    </RadioGroup>

                                    <div className="text-center pt-8 border-t border-white/10">
                                        <p className="text-zinc-500">
                                            Already have an account?{" "}
                                            <Link href="/login" className="text-white hover:underline font-bold transition-all">
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
                                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-8 group transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        Back to selection
                                    </button>

                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Basic Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400 ml-1">Full Name</label>
                                                    <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400 ml-1">Email Address</label>
                                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@example.com" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
                                                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400 ml-1">Location</label>
                                                    <LocationAutocomplete value={location} onChange={setLocation} placeholder="City, Country" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/10" />

                                        <div className="space-y-6">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{roles.find(r => r.id === selectedRole)?.name} Details</h3>
                                            {selectedRole === "DEVELOPER" && (
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-zinc-400 ml-1">Skills & Technologies</label>
                                                        <SkillsAutocomplete value={skills} onChange={setSkills} placeholder="React, Node.js, Python..." />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Select label="Experience Level" value={experience} onChange={(v) => setExperience(v)} options={["Junior (0-2 years)", "Mid (2-5 years)", "Senior (5-8 years)", "Staff/Principal (8+ years)"]} />
                                                        <Select label="Availability" value={availability} onChange={(v) => setAvailability(v)} options={["Available", "Part-time", "Consulting", "Not looking"]} />
                                                    </div>
                                                </div>
                                            )}

                                            {selectedRole === "INVESTOR" && (
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-zinc-400 ml-1">Firm / Company</label>
                                                        <Input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Acme Ventures (Optional)" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Select label="Check Size" value={checkSize} onChange={(v) => setCheckSize(v)} options={[{ label: "<$50K (Angel)", value: "<$50K" }, { label: "$50K - $250K", value: "$50K - $250K" }, { label: "$250K - $1M", value: "$250K - $1M" }, { label: "$1M+", value: "$1M+" }]} />
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-zinc-400 ml-1">Primary Focus</label>
                                                            <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. SaaS, Fintech, AI" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedRole === "FOUNDER" && (
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-zinc-400 ml-1">Startup Name</label>
                                                        <Input value={startupName} onChange={(e) => setStartupName(e.target.value)} required placeholder="Your Startup Name" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-zinc-400 ml-1">Elevator Pitch</label>
                                                        <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} required rows={3} placeholder="Describe your startup in 1-2 sentences." className="bg-white/5 border-white/10 rounded-2xl" />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Select label="Current Stage" value={stage} onChange={(v) => setStage(v)} options={[{ label: "Idea Phase", value: "Idea" }, { label: "MVP / Prototype", value: "MVP" }, { label: "Pre-seed", value: "Pre-seed" }, { label: "Seed", value: "Seed" }, { label: "Series A+", value: "Series A+" }]} />
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-zinc-400 ml-1">Website</label>
                                                            <Input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-14 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                                        >
                                            {isLoading ? "Creating Profile..." : "Complete Registration"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </GlassCard>
            </Section>
        </PageShell>
    );
}

