import posthog from "posthog-js";
import { env } from "@/lib/env";

// Initialize PostHog on the client side for Next.js 15.3+
// This is the recommended approach for client-side PostHog initialization
posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY!, {
    // Use reverse proxy to avoid tracking blockers
    api_host: "/ingest",
    // UI host for PostHog toolbar and other UI features
    ui_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    // Use the recommended defaults for 2025
    defaults: '2025-05-24',
    // Enable capturing unhandled exceptions via Error Tracking
    capture_exceptions: true,
    // Only create person profiles for identified users
    person_profiles: "identified_only",
    // Enable page leave tracking for engagement metrics
    capture_pageleave: true,
    // Turn on debug in development mode
    debug: process.env.NODE_ENV === "development",
});

// IMPORTANT: Never combine this approach with other client-side PostHog initialization
// approaches, especially components like a PostHogProvider with useEffect initialization.
// instrumentation-client.ts is the correct solution for initializing client-side PostHog
// in Next.js 15.3+ apps.
