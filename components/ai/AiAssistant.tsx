"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, Search, Mail, GripHorizontal, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const quickActions = [
    { label: "Analyze Pitch", icon: Sparkles, prompt: "Analyze my startup pitch and suggest improvements:" },
    { label: "Find Investors", icon: Search, prompt: "Find investors in the network interested in AI and SaaS:" },
    { label: "Draft Email", icon: Mail, prompt: "Draft a cold email to investor Jasmina Vilić:" },
];

export function AiAssistant() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm your DFDS.io AI assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [disabledReason, setDisabledReason] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Resize state
    const [size, setSize] = useState({ width: 384, height: 500 }); // Default w-96 (384px)
    const isResizingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("startit-ai-chat");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (messages.length > 1) { // Only save if we have more than the greeting
            localStorage.setItem("startit-ai-chat", JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Resize handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;

            const deltaX = lastMousePosRef.current.x - e.clientX;
            const deltaY = lastMousePosRef.current.y - e.clientY;

            setSize(prev => ({
                width: Math.min(Math.max(prev.width + deltaX, 300), 800), // Min 300, Max 800
                height: Math.min(Math.max(prev.height + deltaY, 400), 900) // Min 400, Max 900
            }));

            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, []);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'nwse-resize';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        // Track AI assistant query
        posthog.capture("ai_assistant_query_sent", {
            query_length: userMessage.length,
            conversation_length: messages.length + 1,
        });

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages.concat({ role: "user", content: userMessage }).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            const data = await response.json();

            // Handle API key not configured
            if (response.status === 500 && data.error === "OpenAI API key not configured") {
                setIsDisabled(true);
                setDisabledReason("AI features are currently unavailable. Please try again later.");
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "I apologize, but AI features are temporarily unavailable. The OpenAI integration is not configured. Please contact support or try again later."
                }]);
                return;
            }

            // Handle access gate (referral/subscription required)
            if (response.status === 403 && data.requiresAccess) {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `To use the AI assistant, you need one of the following:\n\n` +
                        `• **Invite ${data.targetReferrals - data.currentReferrals} more friends** (${data.currentReferrals}/${data.targetReferrals} referrals)\n` +
                        `• **Get verified as a Builder**\n` +
                        `• **Upgrade to PRO or GROWTH** (current: ${data.tier})\n\n` +
                        `Visit your settings to learn more!`
                }]);
                return;
            }

            if (!response.ok) throw new Error(data.error || "Failed to fetch response");

            let reply = data.reply;

            // Check for navigation command
            const navMatch = reply.match(/\[NAVIGATE:\s*([^\]]+)\]/);
            if (navMatch) {
                const path = navMatch[1].trim();
                router.push(path);
                // Remove the navigation command from the visible message
                reply = reply.replace(/\[NAVIGATE:\s*[^\]]+\]/, "").trim();
            }

            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        } catch (error) {
            console.error(error);
            // Capture AI assistant error
            posthog.captureException(error instanceof Error ? error : new Error("AI assistant error"));
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please check your API key configuration." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle AI Assistant"
                className={cn(
                    "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
                    isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-indigo-600 hover:bg-indigo-700"
                )}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
            </button>

            {/* Chat Window */}
            <div
                style={{
                    width: isOpen ? size.width : 384,
                    height: isOpen ? size.height : 500,
                }}
                className={cn(
                    "fixed bottom-24 right-6 z-50 max-w-[calc(100vw-3rem)] transition-all duration-300 origin-bottom-right",
                    isOpen ? "opacity-100" : "scale-95 opacity-0 pointer-events-none"
                )}
                onWheel={(e) => e.stopPropagation()}
            >
                <GlassCard variant="dark" className="flex flex-col w-full h-full overflow-hidden border-indigo-500/30 shadow-2xl relative">
                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center hover:bg-white/10 rounded-br-lg transition-colors"
                    >
                        <GripHorizontal className="w-4 h-4 text-zinc-500 rotate-45" />
                    </div>

                    {/* Header */}
                    <div className="p-4 border-b border-white/10 bg-indigo-600/20 flex items-center gap-3 pl-8">
                        <div className="p-2 rounded-xl bg-indigo-600">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">DFDS.io AI</h3>
                            <p className="text-xs text-zinc-300">Powered by GPT-4</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    msg.role === "user" ? "bg-zinc-700" : "bg-indigo-600"
                                )}>
                                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-3xl text-sm",
                                    msg.role === "user"
                                        ? "bg-white/10 text-white rounded-tr-none"
                                        : "bg-indigo-600/20 text-zinc-200 border border-indigo-500/20 rounded-tl-none"
                                )}>
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="p-3 rounded-3xl bg-indigo-600/20 border border-indigo-500/20 rounded-tl-none flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                        {quickActions.map((action, idx) => (
                            <button
                                key={action.label}
                                onClick={() => setInput(action.prompt)}
                                className="group"
                            >
                                <Badge variant="outline" className="flex items-center gap-1.5 cursor-pointer group-hover:bg-white/10 group-hover:text-white transition-colors whitespace-nowrap">
                                    <action.icon className="w-3 h-3" />
                                    {action.label}
                                </Badge>
                            </button>
                        ))}
                    </div>

                    {/* Disabled Warning */}
                    {isDisabled && disabledReason && (
                        <div className="mx-4 mb-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <p className="text-xs text-amber-300">{disabledReason}</p>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/20">
                        <div className="relative">
                            <Input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isDisabled ? "AI assistant unavailable" : "Ask about startups..."}
                                disabled={isDisabled}
                                aria-label="AI assistant input"
                                className="pr-12 py-6"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading || isDisabled}
                                aria-label="Send message"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-indigo-400 hover:text-white hover:bg-indigo-600/50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-indigo-400"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </GlassCard>
            </div>
        </>
    );
}
