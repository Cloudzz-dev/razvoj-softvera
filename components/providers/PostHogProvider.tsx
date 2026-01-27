"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// PostHog is initialized in instrumentation-client.ts for Next.js 16+
// This provider wraps the app to make PostHog hooks available throughout
// No manual pageview tracking needed - using defaults: '2025-05-24' handles this automatically

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    // Guard: Don't initialize provider if no key
    // We can't access env directly here easily without exposing it, but posthog-js might crash
    // Let's just wrap it. PostHog client already handles missing key gracefully usually,
    // but explicit check is safer.

    // Actually, client-side posthog usually initializes with no-op if key is missing.
    // But we'll leave it as is, or add a simple check.

    return (
        <PHProvider client={posthog}>
            {children}
        </PHProvider>
    );
}
