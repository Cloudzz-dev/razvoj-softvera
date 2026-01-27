"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Copy, Check, Terminal, Code, Server, Play, Key, Plus, Trash2,
    Edit2, RefreshCw, Shield, Clock, AlertCircle, Book, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    fullKey?: string; // Only available right after creation
    isActive: boolean;
    permissions: string[];
    lastUsed: string | null;
    createdAt: string;
    expiresAt: string | null;
}

interface ApiDoc {
    version: string;
    title: string;
    description: string;
    baseUrl: string;
    authentication: {
        type: string;
        description: string;
        example: string;
    };
    endpoints: Array<{
        category: string;
        routes: Array<{
            method: string;
            path: string;
            description: string;
            authentication?: string;
            requestBody?: any;
            response?: any;
            example?: any;
            queryParameters?: any;
            parameters?: any;
            note?: string;
        }>;
    }>;
    rateLimit: {
        requests: number;
        period: string;
    };
    errors: Record<string, string>;
}

const methodColors: Record<string, string> = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ApiPage() {
    useSession();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [docs, setDocs] = useState<ApiDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [creatingKey, setCreatingKey] = useState(false);
    const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

    const fetchApiKeys = useCallback(async () => {
        try {
            const res = await fetch("/api/keys");
            if (res.ok) {
                const data = await res.json();

                // Smart merge to preserve fullKey if it exists in current state
                setApiKeys(currentKeys => {
                    return data.map((fetchedKey: ApiKey) => {
                        const existing = currentKeys.find(k => k.id === fetchedKey.id);
                        if (existing?.fullKey) {
                            return {
                                ...fetchedKey,
                                key: existing.key, // Keep the display key with "..." if that's what we want, or the full key
                                fullKey: existing.fullKey // Key line: Preserve the full key
                            };
                        }
                        return fetchedKey;
                    });
                });

                if (data.length > 0) {
                    // Only set selected key if we haven't selected one yet
                    setSelectedKey(prev => prev || data[0].key);
                }
            }
        } catch (error) {
            console.error("Failed to fetch API keys:", error);
        } finally {
            setLoading(false);
        }
    }, []); // Removed specific dependencies to avoid unnecessary re-fetches

    useEffect(() => {
        fetchApiKeys();
        fetchDocs();
    }, [fetchApiKeys]);

    async function fetchDocs() {
        try {
            const res = await fetch("/api/documentation");
            if (res.ok) {
                const data = await res.json();
                setDocs(data);
            }
        } catch (error) {
            console.error("Failed to fetch docs:", error);
        }
    }

    async function createApiKey() {
        if (!newKeyName.trim()) {
            toast.error("Please enter a name for the API key");
            return;
        }

        setCreatingKey(true);
        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newKeyName }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create API key");
            }

            const newKey = await res.json();

            // Store the full key temporarily (only shown once)
            setApiKeys(prev => [{
                id: newKey.id,
                name: newKey.name,
                key: newKey.keyPrefix + "...",
                fullKey: newKey.key, // Full key from response
                isActive: true,
                permissions: newKey.permissions,
                lastUsed: null,
                createdAt: newKey.createdAt,
                expiresAt: null,
            }, ...prev]);

            setSelectedKey(newKey.keyPrefix + "...");
            setShowNewKeyModal(false);
            setNewKeyName("");
            toast.success("API key created! Copy it now - it won't be shown again.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create key");
        } finally {
            setCreatingKey(false);
        }
    }

    async function deleteApiKey(keyId: string) {
        if (!confirm("Are you sure you want to delete this API key? This cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" });

            if (!res.ok) {
                throw new Error("Failed to delete API key");
            }

            setApiKeys(prev => prev.filter(k => k.id !== keyId));
            toast.success("API key deleted");
        } catch {
            toast.error("Failed to delete API key");
        }
    }

    async function updateKeyName(keyId: string, name: string) {
        try {
            const res = await fetch(`/api/keys/${keyId}/name`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                throw new Error("Failed to update key name");
            }

            setApiKeys(prev => prev.map(k =>
                k.id === keyId ? { ...k, name } : k
            ));
            setEditingKeyId(null);
            toast.success("Key name updated");
        } catch {
            toast.error("Failed to update key name");
        }
    }

    function copyToClipboard(text: string, id: string) {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied to clipboard");
    }

    async function testEndpoint(path: string, method: string) {
        const activeKey = apiKeys.find(k => k.key === selectedKey);
        const keyToUse = activeKey?.fullKey || selectedKey;

        setIsLoading(true);
        setResponse(null);

        try {
            const res = await fetch(path, {
                method,
                headers: {
                    "Authorization": `Bearer ${keyToUse}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();
            setResponse(JSON.stringify(data, null, 2));
        } catch {
            setResponse(JSON.stringify({ error: "Request failed" }, null, 2));
        } finally {
            setIsLoading(false);
        }
    }

    function toggleEndpoint(id: string) {
        setExpandedEndpoints(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Code className="w-8 h-8 text-indigo-400" />
                    Developer API
                </h1>
                <p className="text-zinc-400">
                    Manage your API keys and explore the documentation.
                    <a href="/api-docs" target="_blank" className="text-indigo-400 hover:text-indigo-300 ml-1 inline-flex items-center gap-1">
                        View Full Docs <ChevronDown className="w-3 h-3 -rotate-90" />
                    </a>
                </p>
            </div>

            {/* API Keys Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-400" />
                        Your API Keys
                    </h2>
                    <button
                        onClick={() => setShowNewKeyModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Key
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
                    </div>
                ) : apiKeys.length === 0 ? (
                    <GlassCard className="p-8 text-center border-white/10 bg-black/40 rounded-2xl">
                        <Key className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No API Keys</h3>
                        <p className="text-zinc-400 mb-4">Create your first API key to start using the API</p>
                        <button
                            onClick={() => setShowNewKeyModal(true)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Create API Key
                        </button>
                    </GlassCard>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((apiKey) => (
                            <GlassCard
                                key={apiKey.id}
                                className={`p-4 border-white/10 bg-black/40 transition-all rounded-2xl ${selectedKey === apiKey.key ? "ring-2 ring-indigo-500/50" : ""
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {editingKeyId === apiKey.id ? (
                                                <Input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={() => {
                                                        if (editingName.trim()) {
                                                            updateKeyName(apiKey.id, editingName);
                                                        } else {
                                                            setEditingKeyId(null);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && editingName.trim()) {
                                                            updateKeyName(apiKey.id, editingName);
                                                        } else if (e.key === "Escape") {
                                                            setEditingKeyId(null);
                                                        }
                                                    }}
                                                    className="h-8 py-1"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-white">{apiKey.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingKeyId(apiKey.id);
                                                            setEditingName(apiKey.name);
                                                        }}
                                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                                        aria-label="Edit API key name"
                                                    >
                                                        <Edit2 className="w-3 h-3 text-zinc-400" />
                                                    </button>
                                                </>
                                            )}
                                            {apiKey.isActive ? (
                                                <Badge variant="green">Active</Badge>
                                            ) : (
                                                <Badge variant="red">Inactive</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm text-zinc-400 font-mono">
                                                {apiKey.fullKey || apiKey.key}
                                            </code>
                                            {(apiKey.fullKey || !apiKey.key.includes("...")) && (
                                                <button
                                                    onClick={() => copyToClipboard(apiKey.fullKey || apiKey.key, apiKey.id)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                    title="Copy API Key"
                                                    aria-label="Copy API Key"
                                                >
                                                    {copiedId === apiKey.id ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-zinc-400" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Created {new Date(apiKey.createdAt).toLocaleDateString()}
                                            </span>
                                            {apiKey.lastUsed && (
                                                <span>Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedKey(apiKey.key)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedKey === apiKey.key
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                                }`}
                                        >
                                            Use
                                        </button>
                                        <button
                                            onClick={() => deleteApiKey(apiKey.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-xl text-red-400 transition-colors"
                                            aria-label="Delete API Key"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {apiKey.fullKey && (
                                    <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm">
                                                <p className="text-amber-300 font-medium">Copy your API key now!</p>
                                                <p className="text-amber-200/70">This is the only time you'll see the full key.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>

            {/* Documentation & Console */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* API Documentation */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Book className="w-5 h-5 text-indigo-400" />
                        API Documentation
                    </h2>

                    {docs ? (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {/* Auth Info */}
                            <GlassCard className="p-4 border-white/10 bg-black/40 rounded-2xl">
                                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                    Authentication
                                </h3>
                                <p className="text-sm text-zinc-400 mb-2">{docs.authentication.description}</p>
                                <code className="text-xs text-indigo-300 bg-black/50 px-2 py-1 rounded-lg">
                                    Authorization: Bearer {selectedKey || "YOUR_API_KEY"}
                                </code>
                            </GlassCard>

                            {/* Endpoints */}
                            {docs.endpoints.map((category) => (
                                <div key={category.category}>
                                    <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-2">
                                        {category.category}
                                    </h3>
                                    {category.routes.map((route, idx) => {
                                        const endpointId = `${category.category}-${idx}`;
                                        const isExpanded = expandedEndpoints.has(endpointId);

                                        return (
                                            <GlassCard key={idx} className="p-4 border-white/10 bg-black/40 mb-2 rounded-2xl">
                                                <div
                                                    className="flex items-center justify-between cursor-pointer"
                                                    onClick={() => toggleEndpoint(endpointId)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={cn("font-bold border", methodColors[route.method].split(' ').slice(1).join(' '))}>
                                                            {route.method}
                                                        </Badge>
                                                        <code className="text-sm text-white">{route.path}</code>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                testEndpoint(route.path, route.method);
                                                            }}
                                                            className="p-1.5 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                                            title="Test this endpoint"
                                                            aria-label="Test this endpoint"
                                                        >
                                                            <Play className="w-4 h-4 text-indigo-400" />
                                                        </button>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-zinc-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-zinc-400 mt-2">{route.description}</p>

                                                {isExpanded && (
                                                    <div className="mt-4 space-y-3">
                                                        <div>
                                                            <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Example Request</p>
                                                            <div className="relative">
                                                                <pre className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-300 overflow-x-auto">
                                                                    {`curl -X ${route.method} ${docs.baseUrl}${route.path} \\
  -H "Authorization: Bearer ${selectedKey || "YOUR_API_KEY"}"`}
                                                                </pre>
                                                                <button
                                                                    onClick={() => copyToClipboard(
                                                                        `curl -X ${route.method} ${docs.baseUrl}${route.path} -H "Authorization: Bearer ${selectedKey || "YOUR_API_KEY"}"`,
                                                                        `curl-${endpointId}`
                                                                    )}
                                                                    className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg"
                                                                    aria-label="Copy curl command"
                                                                >
                                                                    {copiedId === `curl-${endpointId}` ? (
                                                                        <Check className="w-3 h-3 text-green-400" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3 text-zinc-400" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {route.response && (
                                                            <div>
                                                                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Response</p>
                                                                <pre className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-green-400 overflow-x-auto">
                                                                    {JSON.stringify(route.response, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </GlassCard>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Rate Limits */}
                            <GlassCard className="p-4 border-white/10 bg-black/40 rounded-2xl">
                                <h3 className="text-sm font-semibold text-white mb-2">Rate Limits</h3>
                                <p className="text-sm text-zinc-400">
                                    {docs.rateLimit.requests} requests per {docs.rateLimit.period}
                                </p>
                            </GlassCard>
                        </div>
                    ) : (
                        <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
                    )}
                </div>

                {/* Live Console */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-indigo-400" />
                        Live Console
                    </h2>

                    <GlassCard className="h-[600px] flex flex-col p-0 border-white/10 bg-black/40 overflow-hidden rounded-2xl">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium text-white">Response Preview</span>
                            </div>
                            <button
                                onClick={() => testEndpoint("/api/v1/startups", "GET")}
                                disabled={isLoading || !selectedKey}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Play className="w-3 h-3" />
                                )}
                                {isLoading ? "Testing..." : "Test /api/v1/startups"}
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-auto font-mono text-xs">
                            {response ? (
                                <pre className="text-green-400 whitespace-pre-wrap">{response}</pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                                    <Server className="w-8 h-8 opacity-50" />
                                    <p>Click a Play button to test an endpoint</p>
                                    {!selectedKey && (
                                        <p className="text-amber-400 text-xs">Create an API key first</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* New Key Modal */}
            {showNewKeyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6 border-white/10 bg-black/90">
                        <h2 className="text-xl font-bold text-white mb-4">Create New API Key</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-300 mb-1 block">Key Name</label>
                                <Input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g., Production, Development, Testing"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowNewKeyModal(false);
                                        setNewKeyName("");
                                    }}
                                    className="px-4 py-2 rounded-lg text-zinc-400 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createApiKey}
                                    disabled={creatingKey || !newKeyName.trim()}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {creatingKey ? "Creating..." : "Create Key"}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
