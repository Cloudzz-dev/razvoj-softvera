import { PostHog } from 'posthog-node';
import { env } from '@/lib/env';

let posthogClient: PostHog | null = null;

/**
 * Get the PostHog client for server-side event tracking.
 *
 * Note: Because server-side functions in Next.js can be short-lived,
 * we set flushAt to 1 and flushInterval to 0 to ensure events are
 * sent immediately and not batched.
 */
export function getPostHogClient(): PostHog {
    if (!posthogClient) {
        // Guard: Return mock if no key
        if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
            return {
                capture: () => { },
                shutdown: async () => { },
                identify: () => { }
            } as unknown as PostHog;
        }

        posthogClient = new PostHog(
            env.NEXT_PUBLIC_POSTHOG_KEY!,
            {
                host: env.NEXT_PUBLIC_POSTHOG_HOST,
                flushAt: 1,
                flushInterval: 0
            }
        );
    }
    return posthogClient;
}

/**
 * Shutdown the PostHog client.
 * Call this after sending events from server-side code.
 */
export async function shutdownPostHog(): Promise<void> {
    if (posthogClient) {
        await posthogClient.shutdown();
    }
}
