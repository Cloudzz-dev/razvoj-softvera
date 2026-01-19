"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function BackgroundGrid({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "relative w-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden rounded-md",
                className
            )}
        >
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            <div className="relative z-20 w-full">{children}</div>
        </div>
    );
}
