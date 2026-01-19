import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

export async function GET(req: Request) {
    try {
        const limit = await ensureRateLimit(req);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!session.user.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Fetch recent activities
        const activities = await prisma.activity.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("ACTIVITY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
