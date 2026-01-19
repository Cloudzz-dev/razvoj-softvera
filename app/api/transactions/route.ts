import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    // Require authentication
    const limit = await ensureRateLimit(request);
    if (limit) return limit;

    const auth = await ensureAuthResponse();
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const userId = session.user.id;

    try {
        let whereClause: any = {};

        if (filter === "sent") {
            whereClause = { senderId: userId };
        } else if (filter === "received") {
            whereClause = { receiverId: userId };
        } else {
            whereClause = {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            };
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                receiver: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Transaction fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
