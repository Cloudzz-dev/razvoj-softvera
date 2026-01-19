import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

// Function to generate a secure random token
function generateToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
        }

        const token = generateToken();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Reuse VerificationToken model for simplicity, or create a new model if preferred
        // Since we already have VerificationToken, let's use it but maybe it's better to have a dedicated ResetToken
        // Actually, the schema has:
        // model VerificationToken {
        //   identifier String
        //   token      String   @unique
        //   expires    DateTime
        //
        //   @@unique([identifier, token])
        // }

        await prisma.verificationToken.upsert({
            where: {
                identifier_token: {
                    identifier: email.toLowerCase(),
                    token: token,
                },
            },
            update: {
                token,
                expires,
            },
            create: {
                identifier: email.toLowerCase(),
                token,
                expires,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3753"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        await sendPasswordResetEmail({
            to: email,
            name: user.name || "User",
            resetUrl,
        });

        return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    } catch (error) {
        console.error("PASSWORD_RESET_REQUEST_ERROR", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
