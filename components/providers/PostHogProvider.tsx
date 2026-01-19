"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// PostHog is initialized in instrumentation-client.ts for Next.js 16+
// This provider wraps the app to make PostHog hooks available throughout
// No manual pageview tracking needed - using defaults: '2025-05-24' handles this automatically

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PHProvider client={posthog}>
            {children}
        </PHProvider>
    );
}
