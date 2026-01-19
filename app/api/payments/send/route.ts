import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";
import { sanitizeText } from "@/lib/sanitize";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const limit = await ensureRateLimit(request);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;

        // Validate input with Zod schema
        const body = await request.json();
        const validatedData = paymentSchema.parse(body);

        // Check for existing transaction with same idempotency key
        const existingTransaction = await prisma.transaction.findUnique({
            where: { idempotencyKey: validatedData.idempotencyKey },
        });

        if (existingTransaction) {
            // Return existing transaction instead of creating duplicate
            return NextResponse.json(existingTransaction);
        }

        // Verify recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: validatedData.recipientId },
            select: { id: true },
        });

        if (!recipient) {
            return NextResponse.json(
                { error: "Recipient not found" },
                { status: 404 }
            );
        }

        // Prevent self-payment
        if (validatedData.recipientId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot send payment to yourself" },
                { status: 400 }
            );
        }

        const serviceFee = validatedData.amount * 0.025;
        const netAmount = validatedData.amount - serviceFee;

        // Create transaction with PENDING status
        // This should be updated to COMPLETED via webhook from payment provider
        const newTransaction = await prisma.transaction.create({
            data: {
                amount: validatedData.amount,
                serviceFee,
                netAmount,
                currency: "USD",
                provider: validatedData.provider,
                status: "PENDING", // Changed from COMPLETED
                description: validatedData.description
                    ? sanitizeText(validatedData.description)
                    : "Payment",
                idempotencyKey: validatedData.idempotencyKey,
                senderId: session.user.id,
                receiverId: validatedData.recipientId,
            },
        });

        // TODO: Integrate with actual payment provider (PayPal, Stripe, etc.)
        // The payment provider should send a webhook to confirm completion
        // Example: await initiatePayment(newTransaction);

        return NextResponse.json(newTransaction);
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Payment send error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
