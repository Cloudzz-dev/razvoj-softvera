"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState("");

    const { update } = useSession();

    const handleDemoLogin = async () => {
        setIsLoading(true);
        setError("");

        // Demo credentials
        const demoEmail = "demo@cloudzz.dev";
        const demoPassword = "password123";

        try {
            const result = await signIn("credentials", {
                email: demoEmail,
                password: demoPassword,
                redirect: false,
            });

            if (result?.error) {
                setError("Demo login failed. Please try again.");
            } else if (result?.ok) {
                posthog.identify(demoEmail, { email: demoEmail, is_demo: true });
                posthog.capture("demo_user_login");
                await update();
                router.refresh();
                router.push("/dashboard");
            }
        } catch (error) {
            setError("An error occurred during demo login.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                // Track failed login attempt
                posthog.capture("login_failed", {
                    error_type: "invalid_credentials",
                });
            } else if (result?.ok) {
                // Identify user and track successful login
                posthog.identify(email, {
                    email: email,
                });
                posthog.capture("user_signed_in", {
                    method: "credentials",
                });

                // [WAR ROOM V2] Instant Auth Sync
                // Force session update to fix "Ghost User" issues where reactivated users see old state
                await update();
                router.refresh(); // Clear server cache

                router.push("/dashboard");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
            // Capture login error
            posthog.captureException(error instanceof Error ? error : new Error("Login error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResetLoading(true);
        setResetMessage("");
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail }),
            });

            const data = await res.json();
            if (res.ok) {
                setResetMessage(data.message);
                // Track password reset request
                posthog.capture("password_reset_requested", {
                    email_provided: true,
                });
                setResetEmail("");
            } else {
                setError(data.error || "Failed to send reset link");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
            // Capture password reset error
            posthog.captureException(error instanceof Error ? error : new Error("Password reset request error"));
        } finally {
            setIsResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />

            <div className="relative z-10 w-full max-w-md">
                <GlassCard className="p-8 border-white/10 bg-black/60">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {isForgotPassword ? "Reset Password" : "Welcome Back"}
                        </h1>
                        <p className="text-zinc-400">
                            {isForgotPassword
                                ? "Enter your email for a reset link"
                                : "Sign in to your DFDS.io account"}
                        </p>
                    </div>

                    {!isForgotPassword ? (
                        <>
                            {/* Email/Password Form */}
                            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        placeholder="team@cloudzz.dev"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsForgotPassword(true);
                                                setError("");
                                                setResetMessage("");
                                            }}
                                            className="text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                    <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </button>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={handleDemoLogin}
                                        disabled={isLoading}
                                        className="w-full px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                                    >
                                        <span>🚀</span>
                                        <span>Test Account (Hackathon Judges)</span>
                                    </button>
                                    <p className="text-center text-xs text-zinc-500 mt-2">
                                        Instant access with demo privileges
                                    </p>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            {/* Forgot Password Form */}
                            <form onSubmit={handleResetRequest} className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="resetEmail" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Email
                                    </label>
                                    <Input
                                        id="resetEmail"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {resetMessage && (
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                        {resetMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isResetLoading}
                                    className="w-full px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isResetLoading ? "Sending..." : "Send Reset Link"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(false)}
                                    className="w-full text-sm text-zinc-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-400">
                            Don't have an account?{" "}
                            <Link href="/join" className="text-white hover:underline font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>


                </GlassCard>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
