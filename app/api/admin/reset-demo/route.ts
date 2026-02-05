import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { restoreDemoData } from "@/lib/demo-utils";

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

    if (!isAuthorized || !session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const whereClause = forceAll ? {} : { createdAt: { gte: twentyFourHoursAgo } };

        // 1. Delete Recent Activity
        await prisma.notification.deleteMany({ where: whereClause });

        // 2. Perform Full Restoration for the Demo User
        // This brings back the original messages, transactions, and metrics
        const targetUserId = (session.user as any).id;
        await restoreDemoData(targetUserId);

        return NextResponse.json({
            success: true,
            message: "Demo state restored to original seed data",
            mode: "restoration"
        });
    } catch (error) {
        console.error("Demo reset failed:", error);
        return NextResponse.json({ error: "Reset failed" }, { status: 500 });
    }
}
