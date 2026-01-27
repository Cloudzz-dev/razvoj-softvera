"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import posthog from "posthog-js";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState({
        analytics: true,
        marketing: false,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("startit-cookie-consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = async (prefs: { analytics: boolean; marketing: boolean }) => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/cookie-consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem("startit-cookie-consent-jwt", data.token);
                }
            }

            localStorage.setItem("startit-cookie-consent", "accepted");

            if (prefs.analytics) {
                posthog.capture("cookie_consent_accepted", { specific_consent: prefs });
            } else {
                posthog.opt_out_capturing();
            }

            setIsVisible(false);
        } catch (error) {
            console.error("Failed to save cookie preferences:", error);
            // Fallback to basic local storage if API fails
            localStorage.setItem("startit-cookie-consent", "accepted");
            setIsVisible(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAcceptAll = () => {
        saveConsent({ analytics: true, marketing: true });
    };

    const handleSavePreferences = () => {
        saveConsent(preferences);
    };

    const togglePreference = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 z-50 mx-auto max-w-4xl"
                >
                    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl md:p-8 shadow-2xl">
                        {!showPreferences ? (
                            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Cookie Consent</h3>
                                    <p className="text-sm text-gray-400 max-w-xl">
                                        We use cookies to improve your experience and track site performance.
                                        We do not share your data with third parties. By clicking "Accept",
                                        you agree to our use of cookies for local telemetry.
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <button
                                        onClick={() => setShowPreferences(true)}
                                        className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white hover:bg-white/5"
                                    >
                                        Preferences
                                    </button>
                                    <button
                                        onClick={handleAcceptAll}
                                        disabled={isSaving}
                                        className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? "Saving..." : "Accept All"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Cookie Preferences</h3>
                                    <p className="text-sm text-gray-400">
                                        Customize your privacy settings. Strictly necessary cookies cannot be disabled.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Strictly Necessary */}
                                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                                        <div>
                                            <p className="font-medium text-white">Strictly Necessary</p>
                                            <p className="text-xs text-gray-400">Required for the site to function.</p>
                                        </div>
                                        <div className="h-6 w-11 rounded-full bg-indigo-600/50 opacity-50 cursor-not-allowed relative">
                                            <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </div>

                                    {/* Analytics */}
                                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                                        <div>
                                            <p className="font-medium text-white">Analytics</p>
                                            <p className="text-xs text-gray-400">Help us improve via anonymous usage data.</p>
                                        </div>
                                        <button
                                            onClick={() => togglePreference("analytics")}
                                            className={`relative h-6 w-11 rounded-full transition-colors ${preferences.analytics ? "bg-indigo-600" : "bg-gray-600"
                                                }`}
                                        >
                                            <motion.div
                                                animate={{ x: preferences.analytics ? 22 : 2 }}
                                                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                                            />
                                        </button>
                                    </div>

                                    {/* Marketing */}
                                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                                        <div>
                                            <p className="font-medium text-white">Marketing</p>
                                            <p className="text-xs text-gray-400">Personalized offers and better relevance.</p>
                                        </div>
                                        <button
                                            onClick={() => togglePreference("marketing")}
                                            className={`relative h-6 w-11 rounded-full transition-colors ${preferences.marketing ? "bg-indigo-600" : "bg-gray-600"
                                                }`}
                                        >
                                            <motion.div
                                                animate={{ x: preferences.marketing ? 22 : 2 }}
                                                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setShowPreferences(false)}
                                        className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white hover:bg-white/5"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSavePreferences}
                                        disabled={isSaving}
                                        className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? "Save Preferences" : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
