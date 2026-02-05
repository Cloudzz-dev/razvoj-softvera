"use client";

import React from "react";
import { DynamicIsland } from "@/components/ui/DynamicIsland";
import { ModernFooter } from "@/components/landing/ModernFooter";
import { motion } from "framer-motion";

interface PageShellProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: boolean;
    compactFooter?: boolean;
    animate?: boolean;
}

export function PageShell({
    children,
    header,
    footer = true,
    compactFooter = false,
    animate = true,
}: PageShellProps) {
    return (
        <main className="flex min-h-screen flex-col bg-black text-white selection:bg-indigo-500/30 relative overflow-x-hidden">
            {/* Navigation */}
            <DynamicIsland />

            {/* Content Container */}
            <div className="relative z-10 w-full flex-1 flex flex-col pt-24 pb-12">
                {header && (
                    <header className="container px-6 md:px-12 lg:px-24 mb-12">
                        {header}
                    </header>
                )}

                <div className="flex-1 w-full h-full">
                    {animate ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    ) : (
                        children
                    )}
                </div>
            </div>

            {/* Footer */}
            {footer && (
                <div className="relative z-20 w-full">
                    <ModernFooter compact={compactFooter} />
                </div>
            )}
        </main>
    );
}
