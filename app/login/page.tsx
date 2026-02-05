"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { ArrowLeft, Rocket } from "lucide-react";

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
                posthog.capture("login_failed", {
                    error_type: "invalid_credentials",
                });
            } else if (result?.ok) {
                posthog.identify(email, {
                    email: email,
                });
                posthog.capture("user_signed_in", {
                    method: "credentials",
                });

                await update();
                router.refresh();
                router.push("/dashboard");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
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
                posthog.capture("password_reset_requested", {
                    email_provided: true,
                });
                setResetEmail("");
            } else {
                setError(data.error || "Failed to send reset link");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
            posthog.captureException(error instanceof Error ? error : new Error("Password reset request error"));
        } finally {
            setIsResetLoading(false);
        }
    };

    return (
        <PageShell footer={false}>
            <Section className="flex items-center justify-center min-h-[80vh]">
                <div className="w-full max-w-md space-y-8">
                    <GlassCard className="p-8 border-white/10 bg-black/40 backdrop-blur-xl">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-bold text-white mb-3">
                                {isForgotPassword ? "Reset Password" : "Welcome Back"}
                            </h1>
                            <p className="text-zinc-400">
                                {isForgotPassword
                                    ? "Enter your email for a reset link"
                                    : "Sign in to your DFDS.io account"}
                            </p>
                        </div>

                        {!isForgotPassword ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2 ml-1">
                                            Email Address
                                        </label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-white/5 border-white/10 focus:border-white/20 h-12 rounded-2xl"
                                            placeholder="name@company.com"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2 ml-1">
                                            <label htmlFor="password" className="block text-sm font-medium text-zinc-400">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsForgotPassword(true);
                                                    setError("");
                                                    setResetMessage("");
                                                }}
                                                className="text-xs text-zinc-500 hover:text-white transition-colors"
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
                                            className="bg-white/5 border-white/10 focus:border-white/20 h-12 rounded-2xl"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-black/40 px-2 text-zinc-500">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDemoLogin}
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Rocket className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span>Demo Account</span>
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetRequest} className="space-y-6">
                                <div>
                                    <label htmlFor="resetEmail" className="block text-sm font-medium text-zinc-400 mb-2 ml-1">
                                        Email Address
                                    </label>
                                    <Input
                                        id="resetEmail"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10 focus:border-white/20 h-12 rounded-2xl"
                                        placeholder="name@company.com"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {resetMessage && (
                                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                                        {resetMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isResetLoading}
                                    className="w-full h-12 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
                                >
                                    {isResetLoading ? "Sending..." : "Send Reset Link"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(false)}
                                    className="w-full text-sm text-zinc-500 hover:text-white transition-colors text-center"
                                >
                                    Back to Login
                                </button>
                            </form>
                        )}

                        <div className="mt-8 text-center">
                            <p className="text-sm text-zinc-500">
                                Don&apos;t have an account?{" "}
                                <Link href="/join" className="text-white hover:underline font-bold transition-all">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </GlassCard>

                    <div className="text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to home
                        </Link>
                    </div>
                </div>
            </Section>
        </PageShell>
    );
}
