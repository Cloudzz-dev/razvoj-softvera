import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
    const startupCount = await prisma.startup.count();
    const devCount = await prisma.user.count({ where: { role: 'DEVELOPER' } });
    const investorCount = await prisma.user.count({ where: { role: 'INVESTOR' } });
    const founderCount = await prisma.user.count({ where: { role: 'FOUNDER' } });

    console.log(`Database Counts:`);
    console.log(`- Startups: ${startupCount}`);
    console.log(`- Developers: ${devCount}`);
    console.log(`- Investors: ${investorCount}`);
    console.log(`- Founders: ${founderCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
