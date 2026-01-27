"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { MessageCircle, Heart, Send, TrendingUp, User, Users, Calendar, Plus, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import posthog from "posthog-js";

interface ThreadReply {
    id: string;
    content: string;
    likes: number;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        role: string;
    };
}

interface Thread {
    id: string;
    title: string;
    content: string;
    tags: string[];
    author: {
        id: string;
        name: string | null;
        role: string;
        company?: string | null;
    };
    replies: ThreadReply[];
    likeCount: number;
    replyCount: number;
    createdAt: string;
}

export default function ThreadsPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [newReply, setNewReply] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    // Create thread modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTags, setNewTags] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Fetch threads
    useEffect(() => {
        async function fetchThreads() {
            try {
                const res = await fetch("/api/threads");
                if (!res.ok) throw new Error("Failed to fetch threads");
                const data = await res.json();
                setThreads(data.threads);
            } catch (error) {
                console.error("Failed to fetch threads:", error);
                toast.error("Failed to load threads");
            } finally {
                setIsLoading(false);
            }
        }
        fetchThreads();
    }, []);

    const handleLike = async (threadId: string) => {
        try {
            const res = await fetch(`/api/threads/${threadId}/like`, { method: "POST" });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to like");
            }

            const data = await res.json();
            setThreads(prev => prev.map(t =>
                t.id === threadId
                    ? { ...t, likeCount: t.likeCount + (data.liked ? 1 : -1) }
                    : t
            ));

            // Track thread like
            if (data.liked) {
                const thread = threads.find(t => t.id === threadId);
                posthog.capture("thread_liked", {
                    thread_id: threadId,
                    thread_title: thread?.title,
                    new_like_count: (thread?.likeCount || 0) + 1,
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to like thread");
        }
    };

    const handlePostReply = async (threadId: string) => {
        if (!newReply.trim()) return;

        setIsPosting(true);
        try {
            const res = await fetch(`/api/threads/${threadId}/replies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newReply }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to post reply");
            }

            const data = await res.json();

            // Update thread with new reply
            setThreads(prev => prev.map(t =>
                t.id === threadId
                    ? {
                        ...t,
                        replies: [...t.replies, data.reply],
                        replyCount: t.replyCount + 1
                    }
                    : t
            ));

            // Track reply posted
            const thread = threads.find(t => t.id === threadId);
            posthog.capture("thread_reply_posted", {
                thread_id: threadId,
                thread_title: thread?.title,
                reply_length: newReply.length,
                new_reply_count: (thread?.replyCount || 0) + 1,
            });

            setNewReply("");
            toast.success("Reply posted!");
        } catch (error: any) {
            toast.error(error.message || "Failed to post reply");
            posthog.captureException(error instanceof Error ? error : new Error(error.message || "Reply post error"));
        } finally {
            setIsPosting(false);
        }
    };

    const handleCreateThread = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsCreating(true);
        try {
            const tags = newTags.split(",").map(t => t.trim()).filter(t => t);

            const res = await fetch("/api/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    content: newContent,
                    tags,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to create thread");
            }

            const data = await res.json();

            // Add new thread to list
            setThreads(prev => [{
                ...data.thread,
                replies: [],
                likeCount: 0,
                replyCount: 0
            }, ...prev]);

            // Track thread creation
            posthog.capture("thread_created", {
                thread_id: data.thread.id,
                thread_title: newTitle,
                content_length: newContent.length,
                tags_count: tags.length,
                tags: tags,
            });

            // Reset form
            setNewTitle("");
            setNewContent("");
            setNewTags("");
            setShowCreateModal(false);
            toast.success("Thread created!");
        } catch (error: any) {
            toast.error(error.message || "Failed to create thread");
            posthog.captureException(error instanceof Error ? error : new Error(error.message || "Thread creation error"));
        } finally {
            setIsCreating(false);
        }
    };

    const getRoleLabel = (role: string, company?: string | null) => {
        if (company) return `${role} @ ${company}`;
        return role;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-zinc-400">Loading threads...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <MessageCircle className="w-10 h-10 text-indigo-400" />
                            Community Threads
                        </h1>
                        <p className="text-zinc-400">Connect, discuss, and collaborate with the startup community</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Thread
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{threads.length}</p>
                                <p className="text-sm text-zinc-400">Active Threads</p>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="w-8 h-8 text-purple-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {threads.reduce((acc, t) => acc + t.replyCount, 0)}
                                </p>
                                <p className="text-sm text-zinc-400">Total Replies</p>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-pink-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {threads.reduce((acc, t) => acc + t.likeCount, 0)}
                                </p>
                                <p className="text-sm text-zinc-400">Total Likes</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Empty state */}
                {threads.length === 0 && (
                    <GlassCard className="p-12 text-center">
                        <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No threads yet</h3>
                        <p className="text-zinc-400 mb-4">Be the first to start a conversation!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Create Thread
                        </button>
                    </GlassCard>
                )}

                {/* Threads List */}
                <div className="space-y-4">
                    {threads.map((thread) => (
                        <GlassCard key={thread.id} className="p-6 hover:bg-white/5 transition-all">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Author Info */}
                                    <div className="mb-2">
                                        <h3 className="font-semibold text-white">{thread.author.name || "Anonymous"}</h3>
                                        <p className="text-sm text-zinc-400">{getRoleLabel(thread.author.role, thread.author.company)}</p>
                                    </div>

                                    {/* Thread Title & Content */}
                                    <h2 className="text-xl font-bold text-white mb-2">{thread.title}</h2>
                                    <p className="text-zinc-300 mb-4">{thread.content}</p>

                                    {/* Tags */}
                                    {thread.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {thread.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Meta */}
                                    <div className="flex items-center gap-6 text-sm text-zinc-400 mb-4">
                                        <button
                                            onClick={() => handleLike(thread.id)}
                                            className="flex items-center gap-2 hover:text-pink-400 transition-colors"
                                        >
                                            <Heart className="w-4 h-4" />
                                            {thread.likeCount}
                                        </button>
                                        <button
                                            onClick={() => setSelectedThread(selectedThread?.id === thread.id ? null : thread)}
                                            className="flex items-center gap-2 hover:text-indigo-400 transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            {thread.replyCount} replies
                                        </button>
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {/* Replies Section */}
                                    {selectedThread?.id === thread.id && (
                                        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                                            {/* Existing Replies */}
                                            {thread.replies.map((reply) => (
                                                <div key={reply.id} className="flex gap-3 ml-4">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-1">
                                                            <span className="font-semibold text-white text-sm">{reply.author.name || "Anonymous"}</span>
                                                            <span className="text-xs text-zinc-500 ml-2">{reply.author.role}</span>
                                                        </div>
                                                        <p className="text-sm text-zinc-300 mb-2">{reply.content}</p>
                                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                            <span className="flex items-center gap-1">
                                                                <Heart className="w-3 h-3" />
                                                                {reply.likes}
                                                            </span>
                                                            <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Reply Input */}
                                            <div className="flex gap-3 ml-4 mt-4">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={newReply}
                                                        onChange={(e) => setNewReply(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="flex-1"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handlePostReply(thread.id);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handlePostReply(thread.id)}
                                                        disabled={isPosting}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                                    >
                                                        {isPosting ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Create Thread Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-2xl p-6 border-white/10 bg-black/90">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Create New Thread</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                                <Input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="What would you like to discuss?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Content</label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Share your thoughts, questions, or ideas..."
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Tags (comma-separated)</label>
                                <Input
                                    type="text"
                                    value={newTags}
                                    onChange={(e) => setNewTags(e.target.value)}
                                    placeholder="e.g., AI, Hiring, Advice"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateThread}
                                disabled={isCreating}
                                className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isCreating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Create Thread
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
