import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { sanitizeText, sanitizeMessage } from "@/lib/sanitize";

import { ensureRateLimit } from "@/lib/api-security";

const contactSchema = z.object({
    name: z.string().min(2, "Name is required").max(100).trim(),
    email: z.string().email("Invalid email").toLowerCase().trim(),
    subject: z.string().min(5, "Subject is required").max(200).trim(),
    message: z.string().min(10, "Message is too short").max(2000).trim(),
});

export async function POST(req: Request) {
    try {

        // Rate limiting
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const body = await req.json();
        const validatedData = contactSchema.parse(body);

        // Sanitize
        const sanitizedData = {
            name: sanitizeText(validatedData.name),
            email: validatedData.email,
            subject: sanitizeText(validatedData.subject),
            message: sanitizeMessage(validatedData.message),
        };

        await prisma.contactMessage.create({
            data: sanitizedData,
        });

        return NextResponse.json({ success: true, message: "Message sent successfully!" });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("CONTACT_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
