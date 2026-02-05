import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    container?: boolean;
}

export function Section({
    children,
    className,
    container = true,
    ...props
}: SectionProps) {
    return (
        <section
            className={cn("w-full py-12 md:py-24", className)}
            {...props}
        >
            {container ? (
                <div className="container px-6 md:px-12 lg:px-24 mx-auto">
                    {children}
                </div>
            ) : (
                children
            )}
        </section>
    );
}
