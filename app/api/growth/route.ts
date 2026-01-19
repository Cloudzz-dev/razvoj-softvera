import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "month";

    try {
        const { getGrowthMetrics } = await import("@/lib/dashboard-queries");
        const growthMetrics = await getGrowthMetrics(timeRange, session.user.id);

        return NextResponse.json(growthMetrics);
    } catch (error) {
        console.error("Growth metrics fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
