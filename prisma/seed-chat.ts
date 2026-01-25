import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting Chat Seeding for Demo User...");

    // 1. Get Demo User
    const demoUser = await prisma.user.findUnique({ where: { email: "demo@cloudzz.dev" } });
    if (!demoUser) {
        console.error("❌ Demo user not found! Please run the main seed first.");
        return;
    }

    // 2. Find partners ( Investors and Developers)
    const chatPartners = await prisma.user.findMany({
        where: {
            NOT: { id: demoUser.id },
            role: { in: ["INVESTOR", "DEVELOPER"] }
        },
        take: 3
    });

    if (chatPartners.length === 0) {
        console.error("❌ No chat partners found.");
        return;
    }

    console.log(`Found ${chatPartners.length} partners to chat with.`);

    for (const partner of chatPartners) {
        // Check if conversation already exists to avoid duplicates
        const existingConv = await prisma.conversation.findFirst({
            where: {
                participants: {
                    every: {
                        userId: { in: [demoUser.id, partner.id] }
                    }
                }
            }
        });

        if (existingConv) {
            console.log(`Skipping existing conversation with ${partner.name}`);
            continue;
        }

        console.log(`Creating conversation with ${partner.name}...`);

        // Create conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: demoUser.id },
                        { userId: partner.id }
                    ]
                }
            }
        });

        // Add detailed messages
        await prisma.message.createMany({
            data: [
                {
                    conversationId: conversation.id,
                    senderId: partner.id,
                    content: "Hi there! I came across your profile and was really impressed by your background.",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
                    read: true
                },
                {
                    conversationId: conversation.id,
                    senderId: demoUser.id,
                    content: "Thanks! I'm currently looking for co-founders for a new project in the Fintech space.",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
                    read: true
                },
                {
                    conversationId: conversation.id,
                    senderId: partner.id,
                    content: "That sounds interesting. I have experience scaling payment infrastructure. Would love to hear more.",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
                    read: false
                }
            ]
        });
    }

    // ALSO: Seed some Transactions for the dashboard graph
    console.log("Seeding recent transactions for Dashboard...");
    const otherUser = chatPartners[0];

    await prisma.transaction.createMany({
        data: [
            {
                senderId: otherUser.id,
                receiverId: demoUser.id,
                amount: 500.00,
                serviceFee: 12.50,
                netAmount: 487.50,
                currency: "USD",
                provider: "CARD",
                status: "COMPLETED",
                description: "Initial investment",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
            },
            {
                senderId: otherUser.id,
                receiverId: demoUser.id,
                amount: 1200.00,
                serviceFee: 30.00,
                netAmount: 1170.00,
                currency: "USD",
                provider: "PAYPAL",
                status: "COMPLETED",
                description: "Consulting fee",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
            }
        ]
    });

    console.log("✅ Chat and Dashboard data seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
