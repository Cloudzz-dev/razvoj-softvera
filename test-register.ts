import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
    console.log("Testing registration logic...");

    const body = {
        name: "Test User Script",
        email: "script@test.com",
        password: "password123",
        role: "DEVELOPER",
        location: "Script City",
        skills: ["Scripting"],
        experience: "1 year",
        availability: "Available"
    };

    try {
        const { name, email, password, role, ...profileData } = body;

        if (!email || !password || !name || !role) {
            throw new Error("Missing required fields");
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log("User already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with profile
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                profile: {
                    create: {
                        ...profileData,
                        // Ensure arrays are handled if needed, but here they are passed as is
                    },
                },
            },
        });

        console.log("User created successfully:", user);

    } catch (error) {
        console.error("REGISTRATION_ERROR", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
