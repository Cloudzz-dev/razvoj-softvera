import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/csrf-token
 * 
 * Generate and return a CSRF token for the authenticated user
 * Client should include this token in X-CSRF-Token header for all
 * state-changing requests (POST, PUT, DELETE, PATCH)
 */
export async function GET() {
    // Require authentication to get CSRF token
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const token = await generateCsrfToken();
    return NextResponse.json({ csrfToken: token });
}
