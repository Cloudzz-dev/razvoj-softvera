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
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = parseInt(searchParams.get("limit") || "20");
    const take = Math.min(Math.max(limitParam, 1), 100); // Clamp between 1 and 100
    const skip = (page - 1) * take;

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

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
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
                take,
                skip,
            }),
            prisma.transaction.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            transactions,
            pagination: {
                total,
                pages: Math.ceil(total / take),
                currentPage: page,
                limit: take
            }
        });
    } catch (error) {
        console.error("Transaction fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
