import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";

// Validation schema for chat messages
const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
});

const chatRequestSchema = z.object({
    messages: z.array(chatMessageSchema).min(1).max(50),
});

/**
 * Build dynamic context about the user from the database
 */
async function buildUserContext(userEmail: string): Promise<string> {
    try {
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: {
                profile: true,
                startups: { take: 5 },
                followers: { select: { id: true } },
                following: { select: { id: true } },
            },
        });

        if (!user) return "User data not available.";

        const connectionCount = user.followers.length + user.following.length;
        const startupCount = user.startups.length;

        let context = `
USER PROFILE:
- Name: ${user.name || "Not set"}
- Role: ${user.role}
- Connections: ${connectionCount}`;

        if (user.role === "FOUNDER" && startupCount > 0) {
            const startupInfo = user.startups.map(s =>
                `  • ${s.name} (${s.stage}) - ${s.pitch}`
            ).join("\n");
            context += `
- User's Startups:
${startupInfo}`;
        }

        if (user.role === "DEVELOPER" && user.profile) {
            context += `
- Skills: ${user.profile.skills?.join(", ") || "Not specified"}
- Experience: ${user.profile.experience || "Not specified"}`;
        }

        if (user.role === "INVESTOR" && user.profile) {
            context += `
- Firm: ${user.profile.firm || "Independent"}
- Focus: ${user.profile.focus || "Not specified"}
- Check Size: ${user.profile.checkSize || "Not specified"}`;
        }

        return context;
    } catch (error) {
        console.error("Error building user context:", error);
        return "User context unavailable.";
    }
}

export async function POST(request: Request) {
    try {
        const limit = await ensureRateLimit(request, "chat");
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check Access Gate (The "Three Paths")
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                referralCount: true,
                isVerifiedBuilder: true,
                subscriptionTier: true
            }
        });

        const hasAccess =
            (user?.referralCount || 0) >= 3 ||
            user?.isVerifiedBuilder ||
            ["PRO", "GROWTH"].includes(user?.subscriptionTier || "FREE");

        if (!user || !hasAccess) {
            return NextResponse.json(
                {
                    error: "Access Denied. Choose your path: Invite friends, Verify as Builder, or Upgrade.",
                    requiresAccess: true,
                    currentReferrals: user?.referralCount || 0,
                    targetReferrals: 3,
                    isVerified: user?.isVerifiedBuilder || false,
                    tier: user?.subscriptionTier || "FREE"
                },
                { status: 403 }
            );
        }

        // Validate request body with Zod
        const body = await request.json();
        const { messages } = chatRequestSchema.parse(body);

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key not configured" },
                { status: 500 }
            );
        }

        // Build dynamic user context from database
        const userContext = await buildUserContext(session.user.email);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful AI assistant for DFDS.io, a platform connecting founders, developers, and investors.
${userContext}

PLATFORM CAPABILITIES & AI TOOLS:
- Pitch Deck Review: Analyze startup pitches and suggest improvements
- Investor Matching: Match startups with investors based on industry and stage
- Outreach Assistant: Draft professional emails to investors or developers
- Market Analysis: Provide insights into startup trends and opportunities
- Navigation: Can navigate the user to different parts of the dashboard

NAVIGATION COMMANDS:
If the user asks to go to a specific page, append [NAVIGATE: /path] to the end of your response.
If the user wants to search or find specific items, append a search query: [NAVIGATE: /path?search=keyword]

Valid paths:
- /dashboard (Overview)
- /dashboard/startups (Browse Startups) - Use ?search=term for specific industries/stages
- /dashboard/network (Developer Network) - Use ?search=term for skills/roles
- /dashboard/investors (Find Investors) - Use ?search=term for focus areas
- /dashboard/threads (Community Threads)
- /dashboard/messages (Messages)
- /dashboard/payments (Payments)
- /dashboard/settings (Settings)

When answering questions:
- Provide actionable advice relevant to startup ecosystem
- Suggest features and connections based on user needs
- Keep responses concise and professional
- Be helpful with drafting emails, reviewing pitches, and finding connections`,
                    },
                    ...messages,
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("OpenAI API error:", error);
            return NextResponse.json(
                { error: "Failed to fetch response from OpenAI" },
                { status: response.status }
            );
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid message format", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
