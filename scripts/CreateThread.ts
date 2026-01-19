
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Creating thread...");

    // Find a user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found!");
        return;
    }

    const thread = await prisma.thread.create({
        data: {
            title: "Test Thread",
            content: "This is a test thread content.",
            tags: ["test", "bug"],
            authorId: user.id,
        }
    });

    console.log("Created thread:", thread.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
