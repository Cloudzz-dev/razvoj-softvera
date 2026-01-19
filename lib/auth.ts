import { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

export const authOptions: AuthOptions = {
    secret: env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma) as any,
    // Fix for Vercel/Cross-site usage
    // @ts-expect-error - trustHost is valid but missing from some type defs
    trustHost: true,
    providers: [
        GithubProvider({
            clientId: env.GITHUB_ID ?? "",
            clientSecret: env.GITHUB_SECRET ?? "",
        }),
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        }),
        CredentialsProvider({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Check database for real users
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        password: true,
                        emailVerified: true,
                        deletedAt: true,
                        scheduledDeletionAt: true,
                    },
                });

                if (!user || !user.password) {
                    return null;
                }

                // Check if account is soft-deleted
                if (user.deletedAt) {
                    const now = new Date();
                    // If scheduledDeletionAt is in the future (or null?), it's a grace period login.
                    // If it is in the past, they should be cleaned up, but let's be strict.
                    if (user.scheduledDeletionAt && user.scheduledDeletionAt > now) {
                        // Reactivate account
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { deletedAt: null, scheduledDeletionAt: null }
                        });
                    } else {
                        throw new Error("Account has been deleted and is scheduled for permanent removal");
                    }
                }

                // Verify password
                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    return null;
                }

                if (!user.emailVerified) {
                    throw new Error("Email not verified");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                } as any;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // For credentials provider, cleanup is already handled in authorize
            // For OAuth providers, check if user is soft-deleted  
            if (account?.provider !== "credentials" && user?.email) {
                const { cleanupExpiredUser } = await import("@/lib/user-cleanup");

                // Check if user should be cleaned up
                const wasDeleted = await cleanupExpiredUser(user.email);
                if (wasDeleted) {
                    // User was permanently deleted, allow re-registration
                    return true;
                }

                // Check if user is soft-deleted but not yet expired
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    select: { id: true, deletedAt: true, scheduledDeletionAt: true },
                });

                if (dbUser?.deletedAt) {
                    const now = new Date();
                    if (dbUser.scheduledDeletionAt && dbUser.scheduledDeletionAt > now) {
                        // Reactivate account
                        await prisma.user.update({
                            where: { id: dbUser.id },
                            data: { deletedAt: null, scheduledDeletionAt: null }
                        });
                        return true;
                    }
                    // Account is deleted but not yet expired (or expired and not cleaned up)
                    return false;
                }
            }
            return true;
        },
        async session({ session, user, token }) {
            if (session.user) {
                // Use token data for credentials provider, user data for OAuth
                if (token?.sub) {
                    session.user.id = token.sub;
                    session.user.role = (token.role as string) || "DEVELOPER";
                } else if (user) {
                    session.user.id = user.id;
                    session.user.role = user.role;
                }
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
            }

            // Force refetch from DB on update trigger
            if (trigger === "update" && token.email) {
                const refreshedUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { role: true }
                });

                if (refreshedUser) {
                    token.role = refreshedUser.role;
                }
            }

            return token;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: "jwt",
    },
};
