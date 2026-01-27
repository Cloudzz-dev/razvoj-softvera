import PusherServer from "pusher";
import PusherClient from "pusher-js";
import { env } from "@/lib/env";

// Server-side Pusher instance
// In Docker, the host should be 'soketi' (service name), but from local dev it's 'localhost'
// We'll trust the env or default to localhost for dev since we are running outside container usually?
// Wait, the user is running `docker-compose up` maybe? 
// If the Next.js app is running LOCALLY (npm run dev), it hits localhost:6001.
// If the Next.js app is in DOCKER (startit-app), it hits soketi:6001.
// Prioritize the public host if set (especially for Vercel/Cloud), otherwise fallback to internal logic
const PUSHER_HOST = env.NEXT_PUBLIC_PUSHER_HOST || env.PUSHER_HOST || "127.0.0.1";
const PUSHER_PORT = env.PUSHER_PORT || "6001";

// Guard: Mock or disable if config is missing to prevent crashes
const isPusherConfigured = env.SOKETI_DEFAULT_APP_ID && env.NEXT_PUBLIC_PUSHER_KEY;

export const pusherServer = isPusherConfigured ? new PusherServer({
    appId: env.SOKETI_DEFAULT_APP_ID!,
    key: env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: env.SOKETI_DEFAULT_APP_SECRET!,
    host: PUSHER_HOST,
    port: PUSHER_PORT,
    useTLS: false,
}) : {
    trigger: async () => { console.warn("Pusher not configured (server)"); return {} as any; }
} as unknown as PusherServer;

// Client-side Pusher instance
export const pusherClient = isPusherConfigured ? new PusherClient(
    env.NEXT_PUBLIC_PUSHER_KEY!,
    {
        wsHost: env.NEXT_PUBLIC_PUSHER_HOST || "127.0.0.1",
        wsPort: parseInt(env.NEXT_PUBLIC_PUSHER_PORT || "6001"),
        forceTLS: false,
        disableStats: true,
        enabledTransports: ["ws", "wss"],
        cluster: "", // Soketi doesn't need cluster, but client might expect it
        userAuthentication: {
            endpoint: "/api/pusher/auth",
            transport: "ajax",
        },
    }
) : {
    subscribe: () => ({ bind: () => { }, unbind: () => { } }),
    unsubscribe: () => { },
    channel: () => ({ trigger: () => { } }),
    connection: { bind: () => { }, unbind: () => { } }
} as unknown as PusherClient;
