import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/email";

import { ensureRateLimit } from "@/lib/api-security";

/**
 * POST /api/resend-verification
 * Resend verification email
 */
export async function POST(req: Request) {
    try {

        // Rate limiting - stricter for resend
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Don't reveal if user exists or not
            return NextResponse.json({
                success: true,
                message: "If an account exists, a verification email will be sent.",
            });
        }

        if (user.emailVerified) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Delete any existing tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { identifier: email.toLowerCase() },
        });

        // Generate new code
        const code = generateVerificationCode();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token
        await prisma.verificationToken.create({
            data: {
                identifier: email.toLowerCase(),
                token: code,
                expires,
            },
        });

        // Send email
        await sendVerificationEmail({
            to: email,
            name: user.name || "there",
            code,
        });

        return NextResponse.json({
            success: true,
            message: "Verification email sent!",
        });
    } catch (error) {
        console.error("RESEND_VERIFICATION_ERROR", error);
        return NextResponse.json(
            { error: "Failed to send verification email" },
            { status: 500 }
        );
    }
}
