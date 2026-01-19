
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Metric Ingestion directly...");

    try {
        // 1. Find a user to attach metric to
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("No user found in DB to attach metric to.");
            process.exit(1);
        }
        console.log(`Found user: ${user.email} (${user.id})`);

        // 2. Create a metric
        const metric = await prisma.metric.create({
            data: {
                type: "active_users",
                value: 123,
                metadata: { source: "direct_verification_script" },
                userId: user.id
            }
        });

        console.log("✅ Metric created successfully:", metric);

        // 3. Verify it exists
        const fetchedMetric = await prisma.metric.findUnique({
            where: { id: metric.id }
        });

        if (!fetchedMetric) {
            throw new Error("Could not fetch the created metric!");
        }
        console.log("✅ Verification successful: Metric persisted and readable.");

    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
