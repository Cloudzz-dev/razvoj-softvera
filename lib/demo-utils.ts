import { prisma } from "@/lib/prisma";

export async function restoreDemoData(userId: string) {
    // 1. Clean up existing data for this user to avoid duplicates
    // We only wipe what we are about to recreate
    await prisma.message.deleteMany({
        where: {
            OR: [
                { senderId: userId },
                { conversation: { participants: { some: { userId } } } }
            ]
        }
    });

    await prisma.transaction.deleteMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }]
        }
    });

    await prisma.metric.deleteMany({
        where: { userId, type: "active_users" }
    });

    // 2. Re-seed Messaging
    const partners = await prisma.user.findMany({
        where: {
            NOT: { id: userId },
            role: { in: ["INVESTOR", "DEVELOPER"] }
        },
        take: 3
    });

    for (const partner of partners) {
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [{ userId }, { userId: partner.id }]
                }
            }
        });

        await prisma.message.createMany({
            data: [
                {
                    conversationId: conversation.id,
                    senderId: partner.id,
                    content: "Hi! I saw your profile and I'm interested in your project.",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                    read: true
                },
                {
                    conversationId: conversation.id,
                    senderId: userId,
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

    // 3. Re-seed Metrics (Growth Chart)
    const now = new Date();
    const metricsData = [];
    for (let i = 0; i < 90; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const baseValue = 50 + (90 - i) * 5;
        const variance = baseValue * 0.2 * (Math.random() - 0.5);
        metricsData.push({
            type: "active_users",
            value: Math.floor(baseValue + variance),
            userId: userId,
            createdAt: date,
        });
    }
    await prisma.metric.createMany({ data: metricsData });

    // 4. Re-seed Transactions (Revenue)
    const allUsers = await prisma.user.findMany({ take: 10, where: { NOT: { id: userId } } });
    for (let i = 0; i < 50; i++) {
        const sender = allUsers[Math.floor(Math.random() * allUsers.length)];
        const daysAgo = Math.floor(Math.pow(Math.random(), 3) * 90);
        const amount = Math.random() > 0.8 ? 50 : Math.floor(Math.random() * 2000) + 500;
        
        await prisma.transaction.create({
            data: {
                senderId: sender.id,
                receiverId: userId,
                amount,
                serviceFee: amount * 0.025,
                netAmount: amount * 0.975,
                status: "COMPLETED",
                provider: "CARD",
                description: "Platform Subscription",
                createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
            }
        });
    }
}
