import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, token, password } = await req.json();

        if (!email || !token || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Verify token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: email.toLowerCase(),
                token: token,
                expires: { gte: new Date() },
            },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // 2. Fetch user with password history
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Password History Check
        // Check against current password
        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                return NextResponse.json({ error: "You cannot reuse your current password" }, { status: 400 });
            }
        }

        // Check against previous passwords
        for (const oldHash of user.previousPasswords) {
            const isMatch = await bcrypt.compare(password, oldHash);
            if (isMatch) {
                return NextResponse.json({ error: "You cannot reuse a previous password" }, { status: 400 });
            }
        }

        // 4. Update password and history
        const hashedPassword = await bcrypt.hash(password, 12);
        const newPreviousPasswords = [...user.previousPasswords];
        if (user.password) {
            newPreviousPasswords.push(user.password);
        }

        // Keep history size reasonable (e.g., last 5 passwords)
        if (newPreviousPasswords.length > 5) {
            newPreviousPasswords.shift();
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                previousPasswords: newPreviousPasswords,
            },
        });

        // 5. Clean up token
        await prisma.verificationToken.deleteMany({
            where: {
                identifier: email.toLowerCase(),
                token: token,
            },
        });

        return NextResponse.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("PASSWORD_RESET_CONFIRM_ERROR", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
