import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "tester@dfds";

    console.log(`Verifying email for ${email}...`);

    const user = await prisma.user.update({
        where: { email },
        data: {
            emailVerified: new Date(),
        },
    });

    console.log(`Updated user ${user.id}: emailVerified set to ${user.emailVerified}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
