import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock environment for NextAuth equivalent (we can't easily mock getServerSession here for a script, 
// so we will test the logic by manually invoking the DB query logic or just ensuring DB state allows the query).
// Actually, to test the API route directly via script is hard without running the server. 
// Instead, let's verify the Prisma query logic that the API uses works with the schema.

// NOTE: This script verifies the database query part of the API, ensuring no Prisma errors occur.
// Validating the actual API endpoint 'fetch' should be done via curl or browser if possible, 
// but this ensures the backend logic is sound.

async function main() {
    console.log('Starting message fetching verification...');

    // 1. Setup Data
    const user1 = await prisma.user.create({
        data: {
            email: `msg-test1-${Date.now()}@example.com`,
            name: 'Msg User 1',
        }
    });
    const user2 = await prisma.user.create({
        data: {
            email: `msg-test2-${Date.now()}@example.com`,
            name: 'Msg User 2',
        }
    });

    const conversation = await prisma.conversation.create({
        data: {
            participants: {
                create: [
                    { userId: user1.id },
                    { userId: user2.id }
                ]
            },
            messages: {
                create: {
                    content: 'Hello World',
                    senderId: user1.id
                }
            }
        }
    });

    console.log('Created conversation:', conversation.id);

    // 2. Run the Query (mimicking the API route)
    const messages = await prisma.message.findMany({
        where: {
            conversationId: conversation.id,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 51,
    });

    console.log(`Fetched ${messages.length} messages.`);
    if (messages.length > 0) {
        console.log('First message content:', messages[0].content);
        console.log('Sender name:', messages[0].sender.name);
    }

    // Cleanup
    await prisma.conversation.delete({ where: { id: conversation.id } });
    await prisma.user.delete({ where: { id: user1.id } });
    await prisma.user.delete({ where: { id: user2.id } }); // This works now because of the cascade :) (but User deletion doesn't cascade to ConversationParticipant automatically in my previous fix? Let's check schema.)
    // Actually, ConversationParticipant has onDelete: Cascade on user relation in the original schema (lines 343).
    // So deleting users cleans up participants. Conversation is left empty or deleted depending on schema?
    // Schema line 345: conversation Conversation @relation... onDelete: Cascade. 
    // No, user deletion cascades to Participant. But Conversation itself? 
    // If all participants are gone, conversation remains? Schema doesn't auto-delete conversation.
    // We'll leave it for now, it's a test script.

    console.log('\nSUCCESS: Message fetching query works.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
