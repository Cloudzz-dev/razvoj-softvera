import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { sanitizeText } from "@/lib/sanitize";
import { ensureRateLimit } from "@/lib/api-security";

// Validation schema for join application
const joinApplicationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    role: z.enum(["DEVELOPER", "FOUNDER", "INVESTOR"]),
    location: z.string().max(100).optional(),

    // Developer fields
    skills: z.array(z.string().max(50)).max(20).optional(),
    experience: z.string().max(50).optional(),
    availability: z.string().max(50).optional(),
    rate: z.string().max(50).optional(),

    // Investor fields
    firm: z.string().max(100).optional(),
    checkSize: z.string().max(50).optional(),
    focus: z.string().max(200).optional(),

    // Founder fields
    startupName: z.string().max(100).optional(),
    pitch: z.string().max(500).optional(),
    stage: z.string().max(50).optional(),
    websiteUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * POST /api/applications/join
 * Public endpoint for join form submissions
 */
export async function POST(req: Request) {
    try {
        // Rate limiting
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const body = await req.json();

        // Validate input
        const validatedData = joinApplicationSchema.parse(body);

        // Sanitize text inputs
        const sanitizedData = {
            name: sanitizeText(validatedData.name),
            email: validatedData.email,
            role: validatedData.role,
            location: validatedData.location ? sanitizeText(validatedData.location) : null,
            skills: validatedData.skills || [],
            experience: validatedData.experience ? sanitizeText(validatedData.experience) : null,
            availability: validatedData.availability || null,
            rate: validatedData.rate || null,
            firm: validatedData.firm ? sanitizeText(validatedData.firm) : null,
            checkSize: validatedData.checkSize || null,
            focus: validatedData.focus ? sanitizeText(validatedData.focus) : null,
            startupName: validatedData.startupName ? sanitizeText(validatedData.startupName) : null,
            pitch: validatedData.pitch ? sanitizeText(validatedData.pitch) : null,
            stage: validatedData.stage || null,
            websiteUrl: validatedData.websiteUrl || null,
        };

        // Check for existing application with same email
        const existingApplication = await prisma.joinApplication.findFirst({
            where: { email: sanitizedData.email },
        });

        if (existingApplication) {
            return NextResponse.json(
                { error: "An application with this email already exists." },
                { status: 409 }
            );
        }

        // Create application
        const application = await prisma.joinApplication.create({
            data: sanitizedData,
        });

        return NextResponse.json({
            success: true,
            message: "Application submitted successfully!",
            applicationId: application.id,
        });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("JOIN_APPLICATION_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
