import {
    Home,
    Rocket,
    Users,
    Briefcase,
    Settings,
    MessageSquare,
    DollarSign,
    MessageCircle,
    Code,
    Shield,
    BarChart3,
    FileEdit,
    Map,
    LucideIcon
} from "lucide-react";

export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    requiredRole?: "ADMIN" | "DEVELOPER" | "FOUNDER" | "INVESTOR";
}

export const dashboardNav: NavItem[] = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Startups", href: "/dashboard/startups", icon: Rocket },
    { name: "Network", href: "/dashboard/network", icon: Users },
    { name: "Investors", href: "/dashboard/investors", icon: Briefcase },
    { name: "Threads", href: "/dashboard/threads", icon: MessageCircle },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Payments", href: "/dashboard/payments", icon: DollarSign },
    { name: "Roadmap", href: "/dashboard/roadmap", icon: Map },
    { name: "Equity Simulator", href: "/dashboard/calculator", icon: BarChart3 },
    { name: "API Access", href: "/dashboard/api-access", icon: Code },
    { name: "Members", href: "/dashboard/members", icon: Shield },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
    { name: "Analytics", href: "/creator/dashboard", icon: BarChart3, requiredRole: "ADMIN" },
    { name: "Blog Admin", href: "/blog/admin", icon: FileEdit, requiredRole: "ADMIN" },
];
