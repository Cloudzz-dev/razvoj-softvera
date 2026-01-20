import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST } from "@/app/api/v1/ingest/metrics/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

describe("API Ingest Security", () => {
    let user: any;
    const plainKey = "sk_live_12345678_testingkey";

    beforeAll(async () => {
        // Create test user and key
        user = await prisma.user.create({
            data: {
                email: "security-test@example.com",
                name: "Security Test User",
            }
        });

        const hashedKey = await bcrypt.hash(plainKey, 10);
        await prisma.apiKey.create({
            data: {
                userId: user.id,
                name: "Test Key",
                keyPrefix: "sk_live_12345678",
                keyHash: hashedKey,
                permissions: ["write"]
            }
        });
    });

    afterAll(async () => {
        await prisma.metric.deleteMany({ where: { userId: user.id } });
        await prisma.apiKey.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    });

    it("should accept valid API key", async () => {
        const req = new NextRequest("http://localhost/api/v1/ingest/metrics", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${plainKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                metricType: "test_metric",
                value: 100
            })
        });

        const response = await POST(req);
        if (response.status !== 200) {
            const data = await response.json();
            console.error("Test Failed. Response:", JSON.stringify(data, null, 2));
        }
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    it("should reject invalid API key", async () => {
        const req = new NextRequest("http://localhost/api/v1/ingest/metrics", {
            method: "POST",
            headers: {
                Authorization: `Bearer sk_live_12345678_INVALID`
            },
            body: JSON.stringify({
                metricType: "test_metric",
                value: 100
            })
        });

        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    it("should reject missing header", async () => {
        const req = new NextRequest("http://localhost/api/v1/ingest/metrics", {
            method: "POST",
            body: JSON.stringify({ metricType: "test", value: 1 })
        });

        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    // Rate limiting is hard to test in unit test environment as it might depend on global state or Redis
    // But we can verify the function is called if we mocked ensuredRateLimit.
    // For integration test, we trust the contract of ensureRateLimit.

    it("should handle collision efficiently", async () => {
        // Create 3 fake keys with same prefix
        const prefix = "sk_live_COLLIDE_";
        for (let i = 0; i < 3; i++) {
            await prisma.apiKey.create({
                data: {
                    userId: user.id,
                    name: `Collision ${i}`,
                    keyPrefix: prefix,
                    keyHash: await bcrypt.hash(`sk_live_COLLIDE_different${i}`, 10)
                }
            });
        }

        const req = new NextRequest("http://localhost/api/v1/ingest/metrics", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${prefix}MATCHINGKEY`
            },
            body: JSON.stringify({ metricType: "test", value: 1 })
        });

        // This should fail quickly (401) and not time out
        const start = Date.now();
        const response = await POST(req as any);
        const duration = Date.now() - start;

        expect(response.status).toBe(401);
        expect(duration).toBeLessThan(2000); // Should be reasonably fast

        // Cleanup
        await prisma.apiKey.deleteMany({ where: { keyPrefix: prefix } });
    });
});
