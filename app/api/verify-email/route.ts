import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { ensureRateLimit } from "@/lib/api-security";

/**
 * POST /api/verify-email
 * Verify email with 6-digit code
 */
export async function POST(req: Request) {
    try {

        // Rate limiting
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: "Email and code are required" },
                { status: 400 }
            );
        }

        // Find the verification token
        const token = await prisma.verificationToken.findFirst({
            where: {
                identifier: email.toLowerCase(),
                token: code,
            },
        });

        if (!token) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Check if expired
        if (new Date() > token.expires) {
            // Delete expired token
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: email.toLowerCase(),
                        token: code,
                    },
                },
            });

            return NextResponse.json(
                { error: "Verification code has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Mark user as verified
        const user = await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: { emailVerified: new Date() },
        });

        // Delete used token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email.toLowerCase(),
                    token: code,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully!",
            user: {
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error("VERIFY_EMAIL_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
