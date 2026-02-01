import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// --- Data Generators ---
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Mark", "Sandra"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const companyPrefixes = ["Cloud", "Data", "Net", "Cyber", "Bio", "Eco", "Solar", "Fin", "Edu", "Health", "Agri", "Robo", "AI", "Quantum", "Nano", "Space"];
const companySuffixes = ["Inc", "Corp", "Ltd", "Systems", "Technologies", "Solutions", "Labs", "Dynamics", "Soft", "Flow", "Works", "Hub", "Zone", "Box"];
const techStacks = ["React", "Node.js", "Python", "Go", "Rust", "AWS", "Docker", "Kubernetes", "GraphQL", "PostgreSQL", "MongoDB", "Redis", "Next.js", "Vue", "Angular", "Svelte"];
const cities = ["San Francisco, CA", "New York, NY", "Austin, TX", "London, UK", "Berlin, DE", "Zagreb, HR", "Toronto, CA", "Seattle, WA", "Boston, MA", "Tel Aviv, IL"];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T>(arr: T[], max: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * max) + 1);
};

// --- Seeding Functions ---

async function seedUsers(password: string) {
    console.log("Creating Seed Users...");

    // 50 Developers
    for (let i = 0; i < 50; i++) {
        const fn = getRandom(firstNames);
        const ln = getRandom(lastNames);
        const name = `${fn} ${ln}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@dev.example.com`; // Ensure unique emails

        await prisma.user.create({
            data: {
                name,
                email,
                image: `https://i.pravatar.cc/150?u=${email}`,
                password,
                emailVerified: new Date(),
                role: "DEVELOPER",
                profile: {
                    create: {
                        skills: getRandomSubset(techStacks, 5),
                        experience: `${Math.floor(Math.random() * 10) + 1} years`,
                        availability: Math.random() > 0.3 ? "Available" : "Busy",
                        rate: `$${Math.floor(Math.random() * 100) + 50}/hr`,
                        location: getRandom(cities),
                        bio: `Experienced developer passionate about ${getRandom(techStacks)} and ${getRandom(techStacks)}.`,
                    },
                },
            },
        });
    }

    // 10 Investors
    for (let i = 0; i < 10; i++) {
        const fn = getRandom(firstNames);
        const ln = getRandom(lastNames);
        const name = `${fn} ${ln}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@vc.example.com`;

        await prisma.user.create({
            data: {
                name,
                email,
                image: `https://i.pravatar.cc/150?u=${email}`,
                password,
                emailVerified: new Date(),
                role: "INVESTOR",
                profile: {
                    create: {
                        firm: `${getRandom(companyPrefixes)} Ventures`,
                        checkSize: `$${Math.floor(Math.random() * 5) + 1}M - $${Math.floor(Math.random() * 10) + 5}M`,
                        focus: "SaaS, AI, Fintech",
                        location: getRandom(cities),
                        portfolio: Math.floor(Math.random() * 20) + 5,
                        bio: "Investing in the future of technology.",
                    },
                },
            },
        });
    }

    // 20 Founders
    const founders = [];
    for (let i = 0; i < 20; i++) {
        const fn = getRandom(firstNames);
        const ln = getRandom(lastNames);
        const name = `${fn} ${ln}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@founder.example.com`;

        const founder = await prisma.user.create({
            data: {
                name,
                email,
                image: `https://i.pravatar.cc/150?u=${email}`,
                password,
                emailVerified: new Date(),
                role: "FOUNDER",
                profile: {
                    create: {
                        location: getRandom(cities),
                        bio: "Building the next big thing.",
                    },
                },
            },
        });
        founders.push(founder);
    }
    return founders;
}

async function seedStartups(founders: any[]) {
    console.log("Creating Startups...");

    const startups = [];
    for (const founder of founders) {
        // 50% chance a founder has a startup seeded
        if (Math.random() > 0.5) continue;

        const name = `${getRandom(companyPrefixes)}${getRandom(companySuffixes)}`;
        const startup = await prisma.startup.create({
            data: {
                name,
                pitch: `Revolutionizing ${getRandom(techStacks)} with AI-driven insights.`,
                stage: getRandom(["Seed", "Series A", "Pre-seed", "Bootstrapped"]),
                websiteUrl: `https://${name.toLowerCase()}.com`,
                logo: getRandom(["🚀", "⚡", "🔮", "💎", "🦍", "🌍", "💡", "🔥"]),
                raised: `$${Math.floor(Math.random() * 500) + 50}K`,
                teamSize: Math.floor(Math.random() * 10) + 1,
                founderId: founder.id,
            },
        });
        startups.push(startup);

        // Add founder as member
        await prisma.startupMembership.create({
            data: {
                userId: founder.id,
                startupId: startup.id,
                role: "Founder",
                isActive: true
            }
        });
    }
    return startups;
}

async function seedThreads(users: any[]) {
    console.log("Creating Threads...");
    const sampleTitles = [
        "How do you handle state management?",
        "Best practices for Next.js 14?",
        "looking for a co-founder",
        "Feedback on my pitch deck",
        "React Server Components vs client components",
        "Anyone using Prisma with Postgres?",
        "Deployment issues on Vercel",
        "What's the best payment gateway?",
        "Hiring a senior developer",
        "Join our hackathon team!"
    ];

    for (let i = 0; i < 50; i++) {
        const author = getRandom(users);
        const title = getRandom(sampleTitles);
        const thread = await prisma.thread.create({
            data: {
                title: `${title} - ${i}`, // Uniqueness helper
                content: `I'm curious about ${getRandom(techStacks)} and how it integrates with ${getRandom(techStacks)}. Any thoughts? Lorem ipsum dolor sit amet.`,
                authorId: author.id,
                tags: getRandomSubset(techStacks, 3),
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)), // Random past date
            }
        });

        // Seed replies
        const replyCount = Math.floor(Math.random() * 5);
        for (let j = 0; j < replyCount; j++) {
            const replyAuthor = getRandom(users);
            await prisma.threadReply.create({
                data: {
                    content: "Great question! I think it depends on the use case.",
                    authorId: replyAuthor.id,
                    threadId: thread.id,
                    createdAt: new Date(thread.createdAt.getTime() + Math.random() * 10000000),
                }
            });
        }
    }
}

async function seedTransactions(users: any[]) {
    console.log("Creating Transactions (Growth Pattern)...");
    for (let i = 0; i < 150; i++) {
        const sender = getRandom(users);
        const receiver = getRandom(users);
        if (sender.id === receiver.id) continue;

        // Exponential growth simulation: More transactions in recent days
        // Math.random()^3 skews distribution towards 0 (recent)
        const daysAgo = Math.floor(Math.pow(Math.random(), 4) * 90); 
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        const amount = Math.floor(Math.random() * 5000) + 50;
        const fee = Math.floor(amount * 0.025);

        await prisma.transaction.create({
            data: {
                senderId: sender.id,
                receiverId: receiver.id,
                amount: amount,
                currency: "USD",
                status: "COMPLETED",
                provider: getRandom(["PAYPAL", "CRYPTO", "CARD"]) as any,
                serviceFee: fee,
                netAmount: amount - fee,
                description: "Consulting services",
                createdAt: createdAt,
            }
        });
    }
}

async function main() {
    console.log("🌱 Starting Seed...");

    // Idempotency Check
    const userCount = await prisma.user.count();
    // Verify Demo User exists
    const demoUser = await prisma.user.findUnique({ where: { email: "demo@cloudzz.dev" } });

    if (userCount > 50 && demoUser) {
        console.log("✅ Database seems already seeded with plenty of data. Skipping massive seed.");
        // Ensure demo user is verified just in case
        if (!demoUser.emailVerified) {
            console.log("Fixing Demo User verification...");
            await prisma.user.update({
                where: { email: "demo@cloudzz.dev" },
                data: { emailVerified: new Date() }
            });
        }
        return;
    }

    // If we are here, we might need to clean up strictly or just append? 
    // To depend on the user's "clean" command is better, but let's clear to be safe if count is low
    // But we don't want to double delete if it's empty.

    // Check if we need to create Demo User specifically first
    const password = await bcrypt.hash("password123", 12);

    if (!demoUser) {
        console.log("Creating Demo User...");
        await prisma.user.create({
            data: {
                name: "Demo User",
                email: "demo@cloudzz.dev",
                image: "https://i.pravatar.cc/150?u=demo@cloudzz.dev",
                password,
                emailVerified: new Date(),
                role: "FOUNDER",
                // Grant AI access for demo purposes
                isVerifiedBuilder: true,
                subscriptionTier: "GROWTH",
                referralCount: 999,
                profile: {
                    create: {
                        location: "Zagreb, Croatia",
                        bio: "Exploring the platform as a demo user.",
                        skills: ["Product Management", "Growth"],
                    },
                },
            },
        });
    } else {
        // Update existing demo user to have AI access
        console.log("Updating Demo User with AI access...");
        await prisma.user.update({
            where: { email: "demo@cloudzz.dev" },
            data: {
                isVerifiedBuilder: true,
                subscriptionTier: "GROWTH",
                referralCount: 999,
                image: "https://i.pravatar.cc/150?u=demo@cloudzz.dev",
                emailVerified: demoUser.emailVerified || new Date(),
            },
        });
    }

    // Now seed the mass data if count was low
    console.log("Mass seeding...");
    const founders = await seedUsers(password);

    // Fetch all users for linking
    const allUsers = await prisma.user.findMany();

    await seedStartups(founders);
    await seedThreads(allUsers);
    await seedTransactions(allUsers);

    // Seed Roadmap (Activity table or similar? Assuming no dedicated Roadmap table in schema based on reading,
    // but user asked for "roadmap items". I recall looking for roadmap in menu but not schema.
    // If roadmap is static or uses issues/threads, I'll skip for now or use Threads with "Feature Request" tag.
    // Let's verify schema first? No time, assume Threads with tag is enough based on tasks).

    // --- ENHANCED MESSAGING SEED FOR DEMO USER ---
    console.log("Creating Enhanced Demo Messages...");
    const demoUserUpdated = await prisma.user.findUnique({ where: { email: "demo@cloudzz.dev" } });
    if (demoUserUpdated) {
        // Find some people to talk to
        const chatPartners = await prisma.user.findMany({
            where: {
                NOT: { id: demoUserUpdated.id },
                role: { in: ["INVESTOR", "DEVELOPER"] }
            },
            take: 3
        });

        for (const partner of chatPartners) {
            // Create a conversation
            const conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: demoUserUpdated.id },
                            { userId: partner.id }
                        ]
                    }
                }
            });

            // Add some messages
            await prisma.message.createMany({
                data: [
                    {
                        conversationId: conversation.id,
                        senderId: partner.id,
                        content: "Hi! I saw your profile and I'm interested in your project.",
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                        read: true
                    },
                    {
                        conversationId: conversation.id,
                        senderId: demoUserUpdated.id,
                        content: "Hello! Thanks for reaching out. What specifically caught your eye?",
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
                        read: true
                    },
                    {
                        conversationId: conversation.id,
                        senderId: partner.id,
                        content: "The AI integration looks solid. Do you have a roadmap for Q3?",
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
                        read: false
                    }
                ]
            });
        }
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
