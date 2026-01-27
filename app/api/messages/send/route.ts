import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { sanitizeMessage } from "@/lib/sanitize";

// Message schema with length validation
const sendMessageSchema = z.object({
    receiverId: z.string().min(1, "Receiver ID is required"),
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(1000, "Message must be less than 1000 characters")
        .trim(),
});

export async function POST(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Validate input with Zod
        const body = await req.json();
        const validatedData = sendMessageSchema.parse(body);

        // Sanitize message content to prevent XSS
        const receiverId = validatedData.receiverId;
        const content = sanitizeMessage(validatedData.content);

        if (!content) {
            return NextResponse.json(
                { error: "Message content is empty after sanitization" },
                { status: 400 }
            );
        }

        // Block self-messaging
        if (user.id === receiverId) {
            return NextResponse.json(
                { error: "You cannot message yourself" },
                { status: 400 }
            );
        }

        // Check for 402 Payment Required for spam prevention (Demo Feature)
        const paymentProof = req.headers.get("x-payment-proof");

        // Simple mock logic: If receiver is "Investor" and sender is not "Investor"
        // and they haven't chatted before, require payment.
        // For the hackathon demo, we'll force it for a specific "Investor" user or random chance.
        // Let's make it deterministic: if content contains "pitch" or "investment", trigger it.
        const isSpammy = content.toLowerCase().includes("pitch") || content.toLowerCase().includes("invest");

        if (isSpammy && !paymentProof) {
             return NextResponse.json(
                {
                    error: "Payment Required",
                    price: "5.00",
                    currency: "USDC",
                    chain: "base-sepolia",
                    address: "0x1234...5678",
                    reason: "Anti-spam deposit required for cold pitches."
                },
                { status: 402 }
            );
        }

        // Get or create conversation between users using utility function
        const { getOrCreateConversation } = await import("@/lib/conversation-utils");
        const conversation = await getOrCreateConversation(user.id, receiverId);

        // Create message
        const message = await prisma.message.create({
            data: {
                content,
                senderId: user.id,
                conversationId: conversation.id,
            },
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        // Create activity for receiver
        await prisma.activity.create({
            data: {
                userId: receiverId,
                type: "message",
                message: `New message from ${user.name}`,
                icon: "💬",
            },
        });

        // Trigger Pusher event for real-time update
        // We include sender details so the frontend doesn't need to fetch them
        const realtimeMessage = {
            id: message.id,
            senderId: user.id,
            senderName: user.name || "Unknown",
            content: message.content,
            timestamp: message.createdAt.toISOString(),
        };

        // Fire and forget (don't await to avoid slowing down response)
        // Check if we have Pusher configured
        try {
            const { pusherServer } = await import("@/lib/pusher");
            // Fire and forget - do not await
            pusherServer.trigger(`private-${conversation.id}`, "new-message", realtimeMessage).catch((error) => {
                console.error("PUSHER_TRIGGER_ERROR", error);
            });
        } catch (error) {
            console.error("PUSHER_ERROR", error);
            const { getPostHogClient } = await import("@/lib/posthog-server");
            const ph = getPostHogClient();
            ph.capture({
                distinctId: user.id,
                event: "pusher_server_error",
                properties: {
                    error: error instanceof Error ? error.message : "Unknown",
                    conversationId: conversation.id
                }
            });
        }

        return NextResponse.json(message);
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("SEND_MESSAGE_ERROR", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
