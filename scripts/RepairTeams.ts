import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for startups without a team...");

    const startups = await prisma.startup.findMany({
        include: {
            team: true,
            founder: true,
        },
    });

    for (const startup of startups) {
        if (!startup.team) {
            console.log(`Fixing startup: ${startup.name} (${startup.id})`);

            // Create Team
            const team = await prisma.team.create({
                data: {
                    startupId: startup.id,
                },
            });

            // Add Founder as OWNER
            await prisma.teamMembership.create({
                data: {
                    teamId: team.id,
                    userId: startup.founderId,
                    role: "OWNER",
                },
            });

            console.log(`  -> Created Team ${team.id} and added founder ${startup.founder.email}`);
        } else {
            console.log(`Startup ${startup.name} already has a team.`);
        }
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
