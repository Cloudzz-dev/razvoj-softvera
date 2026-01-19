import { NextResponse } from "next/server";
import { ensureRateLimit, ensureAuthResponse } from "@/lib/api-security";

export async function POST(request: Request) {
    try {
        const limit = await ensureRateLimit(request);
        if (limit) return limit;

        const auth = await ensureAuthResponse();
        if (auth instanceof NextResponse) return auth;


        const { amount } = await request.json();

        if (typeof amount !== "number" || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const serviceFee = amount * 0.025; // 2.5% service fee
        const netAmount = amount - serviceFee;

        return NextResponse.json({
            amount,
            serviceFee,
            netAmount,
        });
    } catch (error) {
        console.error("Payment calculation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
