import { prisma } from "../lib/prisma";

async function main() {
    const token = await prisma.verificationToken.findFirst({
        where: {
            identifier: "tester@dfds"
        },
        orderBy: {
            expires: 'desc'
        }
    });

    if (token) {
        console.log(`VERIFICATION_CODE:${token.token}`);
    } else {
        console.log("VERIFICATION_CODE:NOT_FOUND");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
