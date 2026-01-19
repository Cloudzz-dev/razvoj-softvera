import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
    try {
        // Validate that NEXTAUTH_SECRET is configured
        if (!env.NEXTAUTH_SECRET) {
            console.error("🔒 [SECURITY] NEXTAUTH_SECRET is not configured for cookie consent endpoint");
            return NextResponse.json(
                { error: "Server configuration error. Please contact support." },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { analytics, marketing } = body;

        const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);

        const jwt = await new SignJWT({
            analytics: !!analytics,
            marketing: !!marketing,
            consentTimestamp: new Date().toISOString()
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1y")
            .sign(secret);

        return NextResponse.json({ token: jwt });
    } catch (error) {
        console.error("Error signing cookie consent JWT:", error);
        return NextResponse.json(
            { error: "Failed to process consent" },
            { status: 500 }
        );
    }
}
