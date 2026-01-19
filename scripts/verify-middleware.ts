
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3000';

async function runTest(name: string, path: string, method: string, headers: Record<string, string> = {}, expectedStatus: number) {
    console.log(`\n🧪 Testing: ${name} [${method} ${path}]`);

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
        });

        if (response.status === expectedStatus) {
            console.log(`✅ PASS: Got ${response.status} as expected.`);
            return true;
        } else {
            console.error(`❌ FAIL: Expected ${expectedStatus}, got ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ FAIL: Request failed - ${(error as any).message}`);
        return false;
    }
}

async function main() {
    console.log("🚀 Starting Middleware Verification...");

    // We need the server running. This script assumes 'npm run dev' is running on port 3000.
    // If you are running this in an agent environment, ensure the server is up.

    const results = [];

    // 1. Public GET Route (Should be allowed)
    results.push(await runTest("Public Page", "/", "GET", {}, 200));

    // 2. Auth Endpoint (Should be allowed - Allowlist `/api/auth/`)
    // Note: 405 Method Not Allowed or 400 Bad Request is fine, as long as it's NOT 403 Forbidden (CSRF) or 401 Unauthorized
    // We expect 200, 400, or 405. We DEFINITELY do not want 403 from our middleware.
    // For this test, let's just check if we get past the middleware. 
    // If the middleware blocks it, it returns { error: "CSRF token missing" } (403).
    // DFDS.io uses next-auth.
    const authRes = await fetch(`${BASE_URL}/api/auth/session`, { method: "GET" });
    if (authRes.status !== 403) {
        console.log(`✅ PASS: Auth Endpoint (/api/auth/session) likely bypassed CSRF check (Status: ${authRes.status})`);
        results.push(true);
    } else {
        console.error(`❌ FAIL: Auth Endpoint blocked by CSRF check (Status: 403)`);
        results.push(false);
    }

    // 3. Protected API Route (Should be blocked by Default Deny or Auth check)
    // We'll access a non-existent API route. 
    // If it falls through to Next.js handler (404), that means it bypassed CSRF/Auth (BAD if it was a protected method).
    // Our middleware checks:
    // a) Auth Protected Routes (starts with /dashboard, /api/protected) -> 401
    // b) API + State Change -> 403 if no token

    // Test 3a: Protected Route Auth Check (GET)
    results.push(await runTest("Protected Route Auth (GET)", "/dashboard", "GET", {}, 307)); // Redirects to login

    // Test 3b: Unknown API Route POST (Should be blocked by CSRF Default Deny)
    // /api/whatever POST -> Should trigger CSRF check -> 403
    results.push(await runTest("Arbitrary API POST (Default Deny)", "/api/test-random-endpoint", "POST", {}, 403));

    // Test 3c: Protected API Route POST (Should be blocked by CSRF or Auth)
    // /api/protected/resource POST -> Should 403 (CSRF) or 401 (Auth)
    // The middleware order is Auth (1) then CSRF (2).
    // If we request /api/protected which IS in PROTECTED_ROUTES, it should 401 first.
    results.push(await runTest("Protected API Auth (POST)", "/api/protected", "POST", {}, 401));

    console.log("\n📊 Summary:");
    const passed = results.filter(r => r).length;
    console.log(`Tests Passed: ${passed}/${results.length}`);

    if (passed === results.length) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

main();
