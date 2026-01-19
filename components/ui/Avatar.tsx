import { User } from "lucide-react";

interface AvatarProps {
    name: string;
    role?: "DEVELOPER" | "INVESTOR" | "FOUNDER" | "SUPPORT" | string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
};

const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
};

const roleColors = {
    DEVELOPER: "from-blue-500 to-cyan-500",
    INVESTOR: "from-purple-500 to-pink-500",
    FOUNDER: "from-orange-500 to-yellow-500",
    SUPPORT: "from-green-500 to-emerald-500",
    default: "from-gray-500 to-slate-500",
};

export function Avatar({ name, role, size = "md", className = "" }: AvatarProps) {
    const colorClass = roleColors[role as keyof typeof roleColors] || roleColors.default;
    const sizeClass = sizeClasses[size];
    const iconSize = iconSizes[size];

    // Get initials from name
    const initials = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className={`${sizeClass} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-semibold shadow-lg ${className}`}
            title={name}
        >
            {initials || <User size={iconSize} />}
        </div>
    );
}

// SVG-based gender avatars for backward compatibility
export function FemaleAvatar({ size = "md", className = "" }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
    const sizeClass = sizeClasses[size];

    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center ${className}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-2/3 h-2/3 text-white">
                <circle cx="12" cy="8" r="4" strokeWidth="2" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    );
}

export function MaleAvatar({ size = "md", className = "" }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
    const sizeClass = sizeClasses[size];

    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ${className}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-2/3 h-2/3 text-white">
                <circle cx="12" cy="8" r="4" strokeWidth="2" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    );
}
