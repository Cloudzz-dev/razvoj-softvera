import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
    title: "Blog | DFDS.io",
    description: "Insights, updates, and stories from the DFDS.io community.",
};

// Force dynamic rendering to avoid build-time DB queries
export const dynamic = "force-dynamic";

async function getBlogPosts() {
    try {
        const posts = await prisma.blogPost.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            include: {
                author: {
                    select: { name: true, image: true },
                },
            },
        });
        return posts;
    } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return [];
    }
}

export default async function BlogPage() {
    const posts = await getBlogPosts();

    return (
        <main className="min-h-screen bg-black text-white py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                        Blog
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Insights, updates, and stories from the DFDS.io community
                    </p>
                </header>

                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-2xl font-semibold text-white mb-2">Coming Soon</h2>
                        <p className="text-zinc-400">
                            We're working on some great content. Check back soon!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {posts.map((post) => (
                            <article
                                key={post.id}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <Link href={`/blog/${post.slug}`}>
                                    <h2 className="text-2xl font-bold text-white mb-2 hover:text-indigo-400 transition-colors">
                                        {post.title}
                                    </h2>
                                </Link>
                                {post.excerpt && (
                                    <p className="text-zinc-400 mb-4">{post.excerpt}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-zinc-500">
                                    <span>{post.author.name || "Anonymous"}</span>
                                    {post.publishedAt && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                {formatDistanceToNow(new Date(post.publishedAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
