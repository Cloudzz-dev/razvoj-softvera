import { NextResponse } from "next/server";

// API Documentation
const apiDocs = {
    version: "1.1.0",
    title: "DFDS.io API Documentation",
    description: "Complete API reference for the DFDS.io platform",
    baseUrl: "https://dfds.cloudzz.dev",
    authentication: {
        type: "Bearer Token",
        description: "Include your API key in the Authorization header",
        example: "Authorization: Bearer sk_live_your_api_key_here",
    },
    endpoints: [
        {
            category: "System",
            routes: [
                {
                    method: "GET",
                    path: "/api/health",
                    description: "Verify API availability",
                    authentication: "Not required",
                    response: { status: "ok" }
                }
            ]
        },
        {
            category: "Discovery",
            routes: [
                {
                    method: "GET",
                    path: "/api/v1/startups",
                    description: "Get all startups",
                    authentication: "Required (API Key)",
                    response: "Array of Startup objects with founder info",
                },
            ],
        },
        {
            category: "External Metrics",
            routes: [
                {
                    method: "POST",
                    path: "/api/v1/ingest/metrics",
                    description: "Ingest growth metrics (Revenue, Users, etc.)",
                    authentication: "Required (API Key)",
                    requestBody: {
                        metricType: "string (required) - e.g. 'revenue', 'active_users'",
                        value: "number (required)",
                        date: "string (optional) - ISO Date",
                        metadata: "object (optional) - Currency, source, etc.",
                    },
                    response: {
                        success: true,
                        metricId: "metric_123"
                    },
                    example: {
                        metricType: "revenue",
                        value: 5000,
                        metadata: { currency: "USD" }
                    }
                }
            ]
        },
        {
            category: "Data Ingestion",
            routes: [
                {
                    method: "POST",
                    path: "/api/v1/team/sync",
                    description: "Bulk sync team members (HR Integration)",
                    authentication: "Required (API Key - Founder)",
                    requestBody: {
                        members: "Array<{ email: string, role: string }>"
                    },
                    response: {
                        success: true,
                        results: { added: 5, invited: 2 }
                    }
                },
                {
                    method: "POST",
                    path: "/api/v1/startup/funding",
                    description: "Update funding stats (Cap Table Integration)",
                    authentication: "Required (API Key - Founder)",
                    requestBody: {
                        totalRaised: "string (e.g. '$5M')",
                        stage: "string (e.g. 'Series A')"
                    },
                    response: { success: true }
                },
                {
                    method: "POST",
                    path: "/api/v1/investor/portfolio",
                    description: "Update portfolio companies (Deal Flow Integration)",
                    authentication: "Required (API Key - Investor)",
                    requestBody: {
                        companies: "Array<{ name: string, website?: string }>"
                    },
                    response: { success: true, updatedCount: 10 }
                }
            ]
        },
    ],
    rateLimit: {
        requests: 60,
        period: "1 minute",
    },
    errors: {
        400: "Bad Request - Missing required fields",
        401: "Unauthorized - Invalid API key",
        403: "Forbidden - Insufficient permissions",
        404: "Not Found - Resource does not exist",
        429: "Too Many Requests - Rate limit exceeded",
        500: "Internal Server Error",
    },
};

export async function GET() {
    return NextResponse.json(apiDocs);
}
