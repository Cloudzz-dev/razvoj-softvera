
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const demoUser = await prisma.user.findUnique({
        where: { email: "demo@cloudzz.dev" },
    });

    if (!demoUser) {
        console.log("Demo user not found!");
        return;
    }

    console.log(`Demo User ID: ${demoUser.id}`);

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderId: demoUser.id },
                { receiverId: demoUser.id }
            ]
        }
    });

    console.log(`Found ${transactions.length} transactions for demo user.`);
    if (transactions.length > 0) {
        console.log("First transaction:", transactions[0]);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
