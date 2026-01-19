import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
    params: Promise<{ slug: string }>;
}

// Force dynamic rendering to avoid build-time DB queries
export const dynamic = "force-dynamic";

async function getPost(slug: string) {
    const post = await prisma.blogPost.findUnique({
        where: { slug, status: "PUBLISHED" },
        include: {
            author: {
                select: { name: true, image: true },
            },
        },
    });
    return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    return {
        title: `${post.title} | DFDS.io Blog`,
        description: post.excerpt || `Read ${post.title} on DFDS.io`,
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-black text-white py-16 px-4 md:px-8">
            <article className="max-w-3xl mx-auto">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </Link>

                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-4 text-zinc-400">
                        <span>By {post.author.name || "Anonymous"}</span>
                        {post.publishedAt && (
                            <>
                                <span>•</span>
                                <time dateTime={post.publishedAt.toISOString()}>
                                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </time>
                            </>
                        )}
                    </div>
                </header>

                {post.coverImage && (
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full rounded-2xl mb-8 object-cover max-h-96"
                    />
                )}

                <div className="prose prose-invert prose-lg max-w-none">
                    {post.content ? (
                        <div
                            className="text-zinc-300 leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    ) : (
                        <p className="text-zinc-400">Content coming soon...</p>
                    )}
                </div>
            </article>
        </main>
    );
}
