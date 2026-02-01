import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";
import { Clock, User, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Blog | DFDS.io",
    description: "Insights, updates, and stories from the DFDS.io community.",
};

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
        <PageShell>
            <Section className="max-w-5xl mx-auto pt-12 md:pt-20">
                <header className="text-center space-y-6 mb-20">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                        Blog
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Insights, updates, and stories from the heart of the DFDS ecosystem.
                    </p>
                </header>

                {posts.length === 0 ? (
                    <GlassCard className="text-center py-24 space-y-6 border-white/10 bg-black/40">
                        <div className="text-6xl">📝</div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Coming Soon</h2>
                            <p className="text-zinc-500 max-w-sm mx-auto">
                                We&apos;re crafting some great content. Join our network to stay updated!
                            </p>
                        </div>
                        <Link href="/join" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-all">
                            Get Started
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {posts.map((post) => (
                            <article key={post.id} className="group">
                                <Link href={`/blog/${post.slug}`}>
                                    <GlassCard className="p-8 md:p-10 border-white/10 bg-black/40 hover:bg-white/5 transition-all group-hover:translate-y-[-4px] duration-300">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-indigo-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h2 className="text-3xl md:text-4xl font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight">
                                                    {post.title}
                                                </h2>
                                                {post.excerpt && (
                                                    <p className="text-lg text-zinc-400 leading-relaxed line-clamp-2">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                        <User size={14} className="text-zinc-400" />
                                                    </div>
                                                    <span className="text-sm font-bold text-zinc-500">{post.author.name || "Anonymous"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                                                    Read More <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </Section>
        </PageShell>
    );
}
