"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

export function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Only take last character
        setCode(newCode);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (newCode.every(c => c) && newCode.join("").length === 6) {
            handleSubmit(newCode.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            const newCode = pasted.split("");
            setCode(newCode);
            handleSubmit(pasted);
        }
    };

    const handleSubmit = async (codeString?: string) => {
        const verificationCode = codeString || code.join("");

        if (verificationCode.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: verificationCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Verification failed");
            }

            // Track email verification success
            posthog.capture("email_verified", {
                email: email,
            });

            setSuccess(true);

            // Redirect to dashboard after short delay
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);

        } catch (err: any) {
            setError(err.message);
            // Capture verification error
            posthog.captureException(err instanceof Error ? err : new Error(err.message || "Email verification error"));
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        setError("");

        try {
            const res = await fetch("/api/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to resend");
            }

            setCountdown(60); // 60 second cooldown
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsResending(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <GlassCard className="w-full max-w-md p-8 border-white/10 bg-black/60 text-center">
                    <div className="p-4 rounded-full bg-green-500/10 text-green-400 w-fit mx-auto mb-6">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
                    <p className="text-zinc-400 mb-4">Redirecting you to your dashboard...</p>
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-md p-8 border-white/10 bg-black/60">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <Image src="/start-it-favicon.png" alt="DFDS.io" width={32} height={32} className="rounded-lg" />
                        <span className="text-xl font-bold text-white">DFDS.io</span>
                    </Link>

                    <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 w-fit mx-auto mb-4">
                        <Mail className="w-8 h-8" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                    <p className="text-zinc-400">
                        We sent a verification code to<br />
                        <span className="text-white font-medium">{email || "your email"}</span>
                    </p>
                </div>

                {/* Code Input */}
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                        <Input
                            key={index}
                            ref={el => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleChange(index, e.target.value)}
                            onKeyDown={e => handleKeyDown(index, e)}
                            disabled={isLoading}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-lg"
                        />
                    ))}
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}

                <button
                    onClick={() => handleSubmit()}
                    disabled={isLoading || code.some(c => !c)}
                    className="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify Email"
                    )}
                </button>

                <div className="mt-6 text-center">
                    <p className="text-zinc-500 text-sm mb-2">Didn't receive the code?</p>
                    <button
                        onClick={handleResend}
                        disabled={isResending || countdown > 0}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : countdown > 0 ? (
                            `Resend in ${countdown}s`
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Resend code
                            </>
                        )}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
