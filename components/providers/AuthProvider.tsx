"use client";

import { SessionProvider, useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";

function AuthWatcher() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            posthog.identify(session.user.id || session.user.email || undefined, {
                email: session.user.email,
                name: session.user.name,
            });
        } else if (status === "unauthenticated") {
            posthog.reset();
        }
    }, [session, status]);

    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthWatcher />
            {children}
        </SessionProvider>
    );
}
