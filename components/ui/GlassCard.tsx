import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hoverEffect?: boolean;
    variant?: "light" | "medium" | "dark";
}

export const GlassCard = React.memo<GlassCardProps>(function GlassCard({
    children,
    className,
    hoverEffect = false,
    variant = "medium",
    ...props
}) {
    const baseClasses = "glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300";

    const variantClasses = {
        light: "bg-black/20 border-white/5 backdrop-blur-sm",
        medium: "bg-black/40 border-white/10 backdrop-blur-md",
        dark: "bg-black/60 border-white/20 backdrop-blur-lg",
    };

    const hoverClasses = hoverEffect ? "hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 motion-reduce:transform-none" : "";

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses[variant],
                hoverClasses,
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-2xl" />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
});
