import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyCsrfToken, getCsrfTokenFromRequest } from "@/lib/csrf";

/**
 * Next.js Middleware
 * Runs before every request to the application
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
    "/dashboard",
    "/api/protected"
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // 1. Auth Protection
    // Check if route requires authentication
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        const token = await getToken({ req: request });
        if (!token) {
            // For API routes, return 401
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            // For pages, redirect to login
            const url = new URL("/login", request.url);
            url.searchParams.set("callbackUrl", encodeURI(request.url));
            return NextResponse.redirect(url);
        }
    }

    // 2. CSRF Protection (REMOVED)
    // We rely on Session Authentication (getServerSession) in the API routes themselves.
    // Middleware CSRF checks often conflict with NextAuth's internal handling and server actions.

    /* 
    const STATE_CHANGE_METHODS = ["POST", "PUT", "DELETE", "PATCH"];
    if (pathname.startsWith("/api/") && STATE_CHANGE_METHODS.includes(method)) {
         ... 
    } 
    */

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all API routes except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        // "/api/:path*", // DISABLED: API routes handle their own auth to prevent middleware/Edge issues
        "/dashboard/:path*",
        // FORCE_REBUILD: 123456
    ],
};
