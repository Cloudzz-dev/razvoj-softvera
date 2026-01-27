"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";

import { UserNav } from "@/components/dashboard/UserNav";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { Badge } from "@/components/ui/badge";
import DonateButton from "@/components/common/DonateButton";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { dashboardNav, adminNav, NavItem } from "@/config/nav";
import { DemoControls } from "@/components/demo/DemoControls";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();

    // Check if user is admin (role stored in session)
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const isDemoUser = session?.user?.email === "demo@cloudzz.dev";

    const renderNavItems = (items: NavItem[], isAdminSection = false, onItemClick?: () => void) => (
        <>
            {isAdminSection && items.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/10">
                    <p className="px-4 py-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                        Admin
                    </p>
                </div>
            )}
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onItemClick}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${isActive
                            ? "bg-white/10 text-white"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            } ${isAdminSection ? "border-l-2 border-purple-500/50" : ""}`}
                    >
                        <Icon className={`w-5 h-5 ${isAdminSection ? "text-purple-400" : ""}`} />
                        <span className="font-medium">{item.name}</span>
                    </Link>
                );
            })}
        </>
    );

    return (
        <div className="min-h-screen relative bg-black selection:bg-indigo-500/30">
            {/* Vibrant Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl p-6 hidden md:flex md:flex-col z-20">
                <Link href="/" className="flex items-center gap-3 mb-8 flex-shrink-0">
                    <Image src="/start-it-favicon.png" alt="DFDS.io" width={32} height={32} className="rounded-2xl" />
                    <h1 className="text-2xl font-bold text-white">DFDS.io</h1>
                    {isDemoUser && (
                        <Badge variant="yellow" className="ml-2 text-[10px] uppercase tracking-wider font-bold">
                            Demo
                        </Badge>
                    )}
                </Link>

                <nav className="space-y-2 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {renderNavItems(dashboardNav)}
                    {isAdmin && renderNavItems(adminNav, true)}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="md:ml-64 relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-6 py-4 gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-white hidden md:block">Dashboard</h2>
                            {isDemoUser && (
                                <Badge variant="yellow" className="text-[10px] uppercase tracking-wider font-bold">
                                    Demo Mode
                                </Badge>
                            )}
                        </div>
                        <div className="flex-1 max-w-xl flex justify-center md:justify-start">
                            <Suspense fallback={<div className="w-full max-w-md h-10 bg-white/5 rounded-xl animate-pulse" />}>
                                <DashboardSearch />
                            </Suspense>
                        </div>
                        <div className="flex items-center gap-3">
                            <DonateButton />
                            <UserNav />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">{children}</main>
                <AiAssistant />
                <DemoControls />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <aside className="absolute left-0 top-0 h-full w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 p-6 animate-in slide-in-from-left duration-300 flex flex-col rounded-r-3xl">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <Link href="/" className="flex items-center gap-3 mb-8 flex-shrink-0">
                            <Image src="/start-it-favicon.png" alt="DFDS.io" width={32} height={32} className="rounded-2xl" />
                            <h1 className="text-2xl font-bold text-white">DFDS.io</h1>
                            {isDemoUser && (
                                <Badge variant="yellow" className="ml-2 text-[10px] uppercase tracking-wider font-bold">
                                    Demo
                                </Badge>
                            )}
                        </Link>

                        <nav className="space-y-2 overflow-y-auto flex-1 pr-2">
                            {renderNavItems(dashboardNav, false, () => setIsMobileMenuOpen(false))}
                            {isAdmin && renderNavItems(adminNav, true, () => setIsMobileMenuOpen(false))}
                        </nav>
                    </aside>
                </div>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SessionProvider>
    );
}
