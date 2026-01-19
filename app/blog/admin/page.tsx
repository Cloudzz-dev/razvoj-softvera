import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlogAdminClient from "./BlogAdminClient";

export const metadata: Metadata = {
    title: "Blog Admin | DFDS.io",
    description: "Manage blog posts",
};

/**
 * Protected admin page - requires ADMIN role
 */
export default async function BlogAdminPage() {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login?callbackUrl=/blog/admin");
    }

    // Role check - must be ADMIN
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, name: true },
    });

    if (!user || user.role !== "ADMIN") {
        redirect("/dashboard?error=unauthorized");
    }

    // Fetch existing posts for the admin
    const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            author: {
                select: { name: true },
            },
        },
    });

    return (
        <main className="min-h-screen bg-black text-white py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Blog Admin</h1>
                    <p className="text-zinc-400">
                        Welcome, {user.name || session.user.email}. Manage your blog posts below.
                    </p>
                </header>

                <BlogAdminClient posts={posts} />
            </div>
        </main>
    );
}
