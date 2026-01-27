import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "indigo" | "green" | "yellow" | "red" | "gray";
  dot?: boolean;
}

function Badge({ className, variant = "default", dot, ...props }: BadgeProps) {
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-white/5 border border-white/10 text-zinc-300 backdrop-blur-sm hover:bg-white/10",
    destructive: "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30",
    outline: "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10",
    indigo: "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300",
    green: "bg-green-500/10 border border-green-500/20 text-green-400",
    yellow: "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400",
    red: "bg-red-500/10 border border-red-500/20 text-red-400",
    gray: "bg-white/5 border border-white/10 text-zinc-400",
  };

  const dots = {
    default: "bg-white",
    secondary: "bg-zinc-400",
    destructive: "bg-red-400",
    outline: "bg-zinc-400",
    indigo: "bg-indigo-400",
    green: "bg-green-400",
    yellow: "bg-yellow-400",
    red: "bg-red-400",
    gray: "bg-zinc-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <div className={cn("w-1.5 h-1.5 rounded-full", dots[variant])} />
      )}
      {props.children}
    </div>
  );
}

export { Badge };
