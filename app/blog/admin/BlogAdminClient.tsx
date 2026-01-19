"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    status: string;
    createdAt: Date;
    author: { name: string | null };
}

interface Props {
    posts: BlogPost[];
}

export default function BlogAdminClient({ posts }: Props) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setSlug(generateSlug(newTitle));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/blog/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    slug,
                    excerpt,
                    content,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create post");
            }

            // Reset form and refresh
            setTitle("");
            setSlug("");
            setExcerpt("");
            setContent("");
            setIsCreating(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (postId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
            const res = await fetch(`/api/blog/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (err) {
            console.error("Failed to toggle status:", err);
        }
    };

    const deletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const res = await fetch(`/api/blog/posts/${postId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (err) {
            console.error("Failed to delete post:", err);
        }
    };

    return (
        <div className="space-y-8">
            {/* Create New Post Button */}
            {!isCreating && (
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Post
                </button>
            )}

            {/* Create Post Form */}
            {isCreating && (
                <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Create New Post</h2>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Post title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Slug</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="post-slug"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Excerpt</label>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Brief description of the post"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            placeholder="Write your post content here..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "Creating..." : "Create Post"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Posts List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">All Posts ({posts.length})</h2>

                {posts.length === 0 ? (
                    <p className="text-zinc-400">No posts yet. Create your first post above!</p>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                            >
                                <div>
                                    <h3 className="font-medium text-white">{post.title}</h3>
                                    <p className="text-sm text-zinc-400">
                                        /{post.slug} • {post.author.name} •{" "}
                                        <span
                                            className={
                                                post.status === "PUBLISHED"
                                                    ? "text-emerald-400"
                                                    : "text-yellow-400"
                                            }
                                        >
                                            {post.status}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(post.id, post.status)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        title={post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                    >
                                        {post.status === "PUBLISHED" ? (
                                            <EyeOff className="w-4 h-4 text-zinc-400" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-emerald-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => deletePost(post.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
