"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, User, Mail, Plus, Trash2, MoreVertical, X, Loader2, Send, Briefcase, Users } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Role = "DEVELOPER" | "FOUNDER" | "INVESTOR" | "ADMIN";
type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    image: string | null;
    createdAt: string;
}

interface StartupMember {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    platformRole: Role;
    startupRole: string;
    joinedAt: string;
    isActive: boolean;
}

interface Startup {
    id: string;
    name: string;
    founderId: string;
}

interface TeamInvite {
    id: string;
    teamId: string;
    email: string;
    role: TeamRole;
    status: "PENDING" | "ACCEPTED" | "EXPIRED";
    expiresAt: string;
    createdAt: string;
}



const roleColors: Record<Role, string> = {
    ADMIN: "bg-purple-500/20 border-purple-500/50 text-purple-300",
    FOUNDER: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    INVESTOR: "bg-green-500/20 border-green-500/50 text-green-300",
    DEVELOPER: "bg-blue-500/20 border-blue-500/50 text-blue-300",
};

const teamRoleColors: Record<TeamRole, string> = {
    OWNER: "bg-purple-500/20 border-purple-500/50 text-purple-300",
    ADMIN: "bg-blue-500/20 border-blue-500/50 text-blue-300",
    MEMBER: "bg-zinc-500/20 border-zinc-500/50 text-zinc-300",
    VIEWER: "bg-zinc-500/20 border-zinc-500/50 text-zinc-400",
};

export default function MembersPage() {
    const { data: session } = useSession();
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<UserData[]>([]); // For Admin
    const [members, setMembers] = useState<StartupMember[]>([]); // For Founder
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [myStartup, setMyStartup] = useState<Startup | null>(null); // For Founder
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [isInviting, setIsInviting] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [startupFilter, setStartupFilter] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const checkRoleAndFetch = useCallback(async () => {
        setLoading(true);
        try {
            // Explicitly check role from session first
            const isUserAdmin = session?.user?.role === "ADMIN";

            if (isUserAdmin) {
                setIsAdmin(true);
                // Fetch Admin Data
                const params = new URLSearchParams();
                if (debouncedSearch) params.append("search", debouncedSearch);
                if (roleFilter !== "ALL") params.append("role", roleFilter);
                if (startupFilter) params.append("startup", startupFilter);

                const adminRes = await fetch(`/api/admin/users?${params.toString()}`);
                if (adminRes.ok) {
                    const data = await adminRes.json();
                    setUsers(data.users);
                }
            } else {
                // Not admin, use Founder logic
                setIsAdmin(false);
                await fetchFounderData();
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [session, debouncedSearch, roleFilter, startupFilter]);


    useEffect(() => {
        if (session?.user) {
            checkRoleAndFetch();
        }
    }, [checkRoleAndFetch, session]);



    async function fetchFounderData() {
        try {
            // Fetch MY startups efficiently using the new endpoint
            const myStartupsRes = await fetch("/api/user/startups");
            if (!myStartupsRes.ok) throw new Error("Failed to fetch user startups");
            const myStartups = await myStartupsRes.json();

            // If user has valid startups, pick the first one (current UI limitation to single startup)
            if (myStartups && myStartups.length > 0) {
                const startup = myStartups[0];
                setMyStartup(startup);

                // Fetch Members for this startup
                // We could optimize this by including members in the /api/user/startups call,
                // but for now we keep the existing endpoint usage for compatibility
                const membersRes = await fetch(`/api/startups/${startup.id}/members`);
                if (membersRes.ok) {
                    const membersData = await membersRes.json();
                    setMembers(membersData);

                    // Fetch Invites
                    const invitesRes = await fetch(`/api/startups/${startup.id}/invites`);
                    if (invitesRes.ok) {
                        setInvites(await invitesRes.json());
                    }
                }
            } else {
                setMyStartup(null);
            }

        } catch (err) {
            console.error("Failed to fetch founder data", err);
        }
    }

    // Admin Functions
    async function updateRole(userId: string, newRole: Role) {
        if (!isAdmin) return;
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
                toast.success("Role updated");
            }
        } catch {
            toast.error("Failed to update role");
        }
    }

    async function deleteUser(userId: string) {
        if (!isAdmin) return;
        if (!confirm("Delete user?")) return;
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                toast.success("User deleted");
            }
        } catch {
            toast.error("Failed to delete user");
        }
    }

    // Invite Function
    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!inviteEmail) return;

        setIsInviting(true);
        try {
            const res = await fetch("/api/team/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Invitation sent!");
                setShowInviteModal(false);
                setInviteEmail("");
                setInviteRole("MEMBER");
            } else {
                toast.error(data.error || "Failed to send invitation");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsInviting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    // ADMIN VIEW
    if (isAdmin) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-purple-400" />
                            Admin User Management
                        </h1>
                        <p className="text-zinc-400">Manage platform users ({users.length})</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Filter by startup..."
                            value={startupFilter}
                            onChange={(e) => setStartupFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="FOUNDER">Founder</option>
                        <option value="INVESTOR">Investor</option>
                        <option value="DEVELOPER">Developer</option>
                    </select>
                </div>

                <div className="grid gap-4">
                    {users.map(user => (
                        <GlassCard key={user.id} className="p-6 border-white/10 bg-black/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                        {user.image ? <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{user.name}</h3>
                                        <p className="text-sm text-zinc-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs border ${roleColors[user.role]}`}>{user.role}</span>
                                    {/* Simplified Role Switcher */}
                                    <div className="flex gap-1 ml-4">
                                        {(["ADMIN", "FOUNDER", "DEVELOPER"] as Role[]).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => updateRole(user.id, r)}
                                                className={`px-2 py-1 rounded text-xs hover:bg-white/10 ${user.role === r ? 'bg-white/10 text-white' : 'text-zinc-500'}`}
                                                title={`Set role to ${r}`}
                                            >
                                                {r[0]}
                                            </button>
                                        ))}
                                        <button onClick={() => deleteUser(user.id)} className="p-1 text-red-400 hover:bg-red-500/10 rounded ml-2"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        );
    }

    // FOUNDER / MEMBER VIEW
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-400" />
                        Team Management
                    </h1>
                    <p className="text-zinc-400">
                        {myStartup ? `Manage members for ${myStartup.name}` : "Manage your startup team"}
                    </p>
                </div>
                {myStartup && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-zinc-400" />
                        Pending Invites
                    </h2>
                    <div className="grid gap-4">
                        {invites.map((invite) => (
                            <GlassCard key={invite.id} className="p-6 border-white/10 bg-black/40 border-l-4 border-l-zinc-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{invite.email}</h3>
                                            <p className="text-sm text-zinc-400">Invited {new Date(invite.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${teamRoleColors[invite.role]}`}>{invite.role}</span>
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-500">Expires {new Date(invite.expiresAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {!myStartup ? (
                <GlassCard className="p-12 text-center border-white/10 bg-black/40">
                    <Briefcase className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Startup Found</h3>
                    <p className="text-zinc-400 mb-6">You haven't created or joined a startup yet.</p>
                    <Link href="/dashboard/startups" className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
                        Browse or Create Startup
                    </Link>
                </GlassCard>
            ) : (
                <div className="grid gap-4">
                    {members.map(member => (
                        <GlassCard key={member.id} className="p-6 border-white/10 bg-black/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                        {member.image ? <img src={member.image} alt={member.name || "User"} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            {member.name || "Unknown User"}
                                            {member.startupRole === "Founder" && (
                                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Founder</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-zinc-400">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-white">{member.startupRole}</p>
                                        <p className="text-xs text-zinc-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                                    </div>
                                    <button className="p-2 text-zinc-400 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6 border-white/10 bg-black/90">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mail className="w-5 h-5 text-indigo-400" />
                                Invite Team Member
                            </h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="colleague@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="VIEWER">Viewer</option>
                                    <option value="OWNER">Owner</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 rounded-lg text-zinc-400 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isInviting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
