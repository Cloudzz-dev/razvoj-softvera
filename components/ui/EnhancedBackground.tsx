"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function EnhancedBackground() {
    const shouldReduceMotion = useReducedMotion();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR and first client render, show the default background to match
    if (!mounted) {
        return (
            <>
                <div className="grid-background"></div>
                <div className="moving-light"></div>
            </>
        );
    }

    if (shouldReduceMotion) {
        return <div className="grid-background opacity-50"></div>;
    }

    return (
        <>
            <div className="grid-background"></div>
            <div className="moving-light"></div>
        </>
    );
}
