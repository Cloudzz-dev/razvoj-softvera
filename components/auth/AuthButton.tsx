"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
}

export function AuthButton({ children, icon }: AuthButtonProps) {
    return (
        <Link
            href="/dashboard"
            className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
            )}
        >
            {icon}
            {children}
        </Link>
    );
}
