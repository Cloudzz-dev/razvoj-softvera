import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const startupPrefixes = ["Cloud", "Eco", "Data", "AI", "Neo", "Fin", "Health", "Edu", "Logi", "Cyber"];
const startupSuffixes = ["Flow", "Scale", "Direct", "Sync", "Link", "Edge", "Hub", "Node", "Base", "Wire"];

function getRandomItem(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log("🌱 Starting large-scale seeding (500 devs, 500 investors, 500 startups)...");

    const password = await bcrypt.hash("password123", 12);
    const startTime = Date.now();

    // 1. Generate Developers
    console.log("Creating 500 Developers...");
    for (let i = 0; i < 500; i++) {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = `dev_${i}_${Date.now()}@example.com`;

        await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: UserRole.DEVELOPER,
                profile: {
                    create: {
                        bio: `Experienced developer specialized in full-stack web development. Passionate about building scalable applications.`,
                        skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
                        experience: `${Math.floor(Math.random() * 10) + 1} years`,
                        availability: "Available",
                        rate: `$${Math.floor(Math.random() * 100) + 50}/hr`,
                        location: "Remote",
                    },
                },
            },
        });
        if ((i + 1) % 100 === 0) console.log(`  - Created ${i + 1} developers`);
    }

    // 2. Generate Investors
    console.log("Creating 500 Investors...");
    for (let i = 0; i < 500; i++) {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = `investor_${i}_${Date.now()}@example.com`;

        await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: UserRole.INVESTOR,
                profile: {
                    create: {
                        bio: `Strategic investor looking for high-growth tech startups.`,
                        firm: `${getRandomItem(startupPrefixes)} Ventures`,
                        checkSize: "$100K - $1M",
                        focus: "SaaS, FinTech, AI",
                        portfolio: Math.floor(Math.random() * 20),
                        location: "Venture City",
                    },
                },
            },
        });
        if ((i + 1) % 100 === 0) console.log(`  - Created ${i + 1} investors`);
    }

    // 3. Generate Founders & Startups
    console.log("Creating 500 Founders & Startups...");
    for (let i = 0; i < 500; i++) {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = `founder_${i}_${Date.now()}@example.com`;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: UserRole.FOUNDER,
                profile: {
                    create: {
                        bio: `Visionary founder building the next big thing.`,
                        location: "Startup Valley",
                    },
                },
            },
        });

        await prisma.startup.create({
            data: {
                name: `${getRandomItem(startupPrefixes)}${getRandomItem(startupSuffixes)}`,
                pitch: "Revolutionizing the industry with innovative technology.",
                stage: "Seed",
                websiteUrl: "https://example-startup.com",
                logo: "🚀",
                raised: `$${Math.floor(Math.random() * 1000)}K`,
                teamSize: Math.floor(Math.random() * 10) + 1,
                founderId: user.id,
            },
        });
        if ((i + 1) % 100 === 0) console.log(`  - Created ${i + 1} founders & startups`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Seeding completed in ${duration} seconds!`);
    console.log(`Total created: 500 Developers, 500 Investors, 500 Founders, 500 Startups.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
