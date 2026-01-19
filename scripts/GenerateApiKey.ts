import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
    const email = "tester@dfds";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error("User not found");
        process.exit(1);
    }

    // Generate a valid key
    const rawKey = "sk_live_" + crypto.randomBytes(24).toString("hex");
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 16);

    await prisma.apiKey.create({
        data: {
            userId: user.id,
            name: "Test Key",
            keyHash,
            keyPrefix,
            permissions: ["write"],
        },
    });

    console.log(`Generated Key: ${rawKey}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
