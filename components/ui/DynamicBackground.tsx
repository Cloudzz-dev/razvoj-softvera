"use client";

import dynamic from "next/dynamic";

const EnhancedBackground = dynamic(
    () => import("@/components/ui/EnhancedBackground").then((mod) => mod.EnhancedBackground),
    { ssr: false }
);

export function DynamicBackground() {
    return <EnhancedBackground />;
}
