import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clear existing data
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.startup.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    const password = await bcrypt.hash("password123", 12);

    // Create Investors
    const investor1 = await prisma.user.create({
        data: {
            name: "Sarah Chen",
            email: "sarah@acmevc.com",
            password,
            role: "INVESTOR",
            profile: {
                create: {
                    firm: "Acme Ventures",
                    checkSize: "$500K - $2M",
                    focus: "SaaS, AI, Fintech",
                    location: "San Francisco, CA",
                    portfolio: 12,
                    bio: "Investing in early-stage B2B SaaS companies.",
                    skills: ["SaaS", "B2B", "Growth"],
                },
            },
        },
    });

    const investor2 = await prisma.user.create({
        data: {
            name: "Marcus Johnson",
            email: "marcus@horizon.com",
            password,
            role: "INVESTOR",
            profile: {
                create: {
                    firm: "Horizon Capital",
                    checkSize: "$1M - $5M",
                    focus: "Deep Tech, Climate",
                    location: "New York, NY",
                    portfolio: 8,
                    bio: "Focused on deep tech and climate solutions.",
                    skills: ["Deep Tech", "Climate", "Hardware"],
                },
            },
        },
    });

    // Create Developers
    const dev1 = await prisma.user.create({
        data: {
            name: "Alex Rivera",
            email: "alex@dev.com",
            password,
            role: "DEVELOPER",
            profile: {
                create: {
                    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
                    experience: "5 years",
                    availability: "Available",
                    rate: "$120/hr",
                    location: "Remote / Austin",
                    bio: "Full-stack developer with a passion for clean code.",
                },
            },
        },
    });

    const dev2 = await prisma.user.create({
        data: {
            name: "Emma Wu",
            email: "emma@dev.com",
            password,
            role: "DEVELOPER",
            profile: {
                create: {
                    skills: ["Python", "AI/ML", "PyTorch", "AWS"],
                    experience: "3 years",
                    availability: "Part-time",
                    rate: "$150/hr",
                    location: "Seattle, WA",
                    bio: "AI engineer specializing in NLP and computer vision.",
                },
            },
        },
    });

    // Create Founders & Startups
    const founder1 = await prisma.user.create({
        data: {
            name: "David Kim",
            email: "david@cloudzz.com",
            password,
            role: "FOUNDER",
            profile: {
                create: {
                    location: "San Francisco, CA",
                    bio: "Building the next generation of cloud infrastructure.",
                },
            },
        },
    });

    await prisma.startup.create({
        data: {
            name: "DFDS",
            pitch: "Serverless cloud infrastructure for AI workloads.",
            stage: "Seed",
            websiteUrl: "https://cloudzz.dev",
            logo: "☁️",
            raised: "$1.2M",
            teamSize: 4,
            founderId: founder1.id,
        },
    });

    const founder2 = await prisma.user.create({
        data: {
            name: "Lisa Park",
            email: "lisa@ecoflow.com",
            password,
            role: "FOUNDER",
            profile: {
                create: {
                    location: "Berlin, Germany",
                    bio: "Sustainable energy management for smart homes.",
                },
            },
        },
    });

    await prisma.startup.create({
        data: {
            name: "EcoFlow",
            pitch: "Smart energy management for residential homes.",
            stage: "Pre-seed",
            websiteUrl: "https://ecoflow.io",
            logo: "🌱",
            raised: "$250K",
            teamSize: 2,
            founderId: founder2.id,
        },
    });

    // Create API Keys for all users
    const users = [investor1, investor2, dev1, dev2, founder1, founder2];

    for (const user of users) {
        // Generate a demo key (in production, use generateApiKey() from lib/api-key-utils)
        const randomKey = `sk_live_${Math.random().toString(36).substring(2, 15)}_${user.id.substring(0, 8)}`;
        const keyPrefix = `sk_live_${randomKey.substring(8, 16)}`;
        const keyHash = await bcrypt.hash(randomKey, 12);

        await prisma.apiKey.create({
            data: {
                name: "Default Key",
                keyHash,
                keyPrefix,
                userId: user.id,
                isActive: true,
                permissions: ["read", "write"],
            },
        });
    }

    console.log("✅ Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
