"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

import { useSession, signOut } from "next-auth/react";
import posthog from "posthog-js";

export function UserNav() {
    const { data: session } = useSession();
    const user = session?.user || {
        name: "Guest User",
        email: "guest@dfds",
        image: null,
    };

    const handleSignOut = async () => {
        // Capture logout event before resetting
        posthog.capture("user_signed_out");
        // Reset PostHog to unlink future events from this user
        posthog.reset();
        // Sign out and redirect to home
        await signOut({ redirect: true, callbackUrl: "/" });
    };

    return (
        <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                {user.image ? (
                    <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                )}
                <span className="text-sm font-medium text-white hidden md:block">
                    {user.name}
                </span>
            </Menu.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-3xl bg-black/80 border border-white/10 backdrop-blur-xl shadow-xl z-20 focus:outline-none">
                    <div className="p-4 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <Menu.Item>
                            {({ active }) => (
                                <Link
                                    href="/dashboard/settings"
                                    className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm w-full text-left ${active ? "bg-white/5 text-white" : "text-zinc-300"}`}
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </Link>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <Link
                                    href="/dashboard/settings"
                                    className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm w-full text-left ${active ? "bg-white/5 text-white" : "text-zinc-300"}`}
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                            )}
                        </Menu.Item>
                    </div>
                    <div className="p-2 border-t border-white/10">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={handleSignOut}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm w-full ${active ? "bg-red-500/10 text-red-300" : "text-red-400"}`}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
