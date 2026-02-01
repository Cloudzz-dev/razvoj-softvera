import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const forceAll = searchParams.get("all") === "true";

    // Security: Only allow in dev/preview or if user is ADMIN
    const isDev = process.env.NODE_ENV !== "production";
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email?.includes("admin");
    const isDemoUser = session?.user?.email === "demo@cloudzz.dev";
    const secret = request.headers.get("x-demo-secret");
    const isAuthorized = isDev || isAdmin || isDemoUser || secret === process.env.DEMO_SECRET;

    if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const whereClause = forceAll ? {} : { createdAt: { gte: oneHourAgo } };

        // 1. Delete Messages
        const deletedMessages = await prisma.message.deleteMany({
            where: whereClause
        });

        // 2. Delete Notifications
        const deletedNotifications = await prisma.notification.deleteMany({
            where: whereClause
        });

        // 3. Delete Transactions
        // If forceAll is true, we delete all transactions. 
        // Otherwise, we only delete pending ones from the last hour.
        const deletedTransactions = await prisma.transaction.deleteMany({
             where: forceAll ? {} : {
                createdAt: { gte: oneHourAgo },
                status: "PENDING"
            }
        });

        return NextResponse.json({
            success: true,
            message: forceAll ? "Full demo reset performed" : "Recent demo state cleaned",
            stats: {
                messages: deletedMessages.count,
                notifications: deletedNotifications.count,
                transactions: deletedTransactions.count
            },
            mode: forceAll ? "all" : "recent"
        });
    } catch (error) {
        console.error("Demo reset failed:", error);
        return NextResponse.json({ error: "Reset failed" }, { status: 500 });
    }
}
