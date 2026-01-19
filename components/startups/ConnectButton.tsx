"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import posthog from "posthog-js";

interface Startup {
    id: string;
    name: string;
    stage: string;
    founder: {
        id: string;
    } | null;
}

export function ConnectButton({ startup }: { startup: Startup }) {
    const router = useRouter();

    const handleConnect = () => {
        if (startup.founder?.id) {
            // Track connect click
            posthog.capture("startup_connect_clicked", {
                startup_id: startup.id,
                startup_name: startup.name,
                startup_stage: startup.stage,
                founder_id: startup.founder.id,
            });
            router.push(`/dashboard/messages?receiverId=${startup.founder.id}`);
        } else {
            toast.error("Could not find founder information");
        }
    };

    return (
        <button
            type="button"
            onClick={handleConnect}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
            Connect
        </button>
    );
}
