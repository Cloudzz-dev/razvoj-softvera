"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { GlassCard } from "./GlassCard";

export const InfiniteMovingCards = ({
    items,
    direction = "left",
    speed = "fast",
    pauseOnHover = true,
    className,
}: {
    items: {
        quote: string;
        name: string;
        title: string;
    }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const scrollerRef = React.useRef<HTMLDivElement>(null);

    const getSpeedClass = () => {
        switch (speed) {
            case "fast":
                return "animate-scroll-fast";
            case "normal":
                return "animate-scroll-normal";
            case "slow":
                return "animate-scroll-slow";
            default:
                return "animate-scroll-normal";
        }
    };

    return (
        <div
            ref={scrollerRef}
            className={cn(
                "relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
                className
            )}
        >
            <div
                className={cn(
                    "flex min-w-full w-max animate-scroll motion-reduce:animate-none",
                    getSpeedClass(),
                    direction === "right" ? "flex-row-reverse" : "flex-row",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {[...items, ...items].map((item, idx) => (
                    <GlassCard
                        key={`${item.name}-${idx}`}
                        variant="light"
                        className="w-[350px] md:w-[450px] flex-shrink-0 mx-2"
                        aria-hidden={idx >= items.length}
                    >
                        <blockquote className="flex flex-col justify-between h-full">
                            <p className="text-sm leading-[1.6] text-zinc-300 font-normal">
                                {item.quote}
                            </p>
                            <div className="mt-6 flex flex-row items-center">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-white">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                        </blockquote>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};
