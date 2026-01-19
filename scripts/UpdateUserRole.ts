import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "tester@dfds";

    console.log(`Updating role for ${email}...`);

    const user = await prisma.user.update({
        where: { email },
        data: {
            role: "FOUNDER",
        },
    });

    console.log(`Updated user ${user.id}: role set to ${user.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
