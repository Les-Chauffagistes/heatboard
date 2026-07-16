import { serialize } from "@/app/api/lib/serialize";
import { getMe } from "@/lib/auth";
import { getServerCookieHeader } from "@/lib/auth.server";
import { prisma } from "@/server/Prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
    const p = await params;
    const user = await getMe(await getServerCookieHeader());
    if (!user) {
        return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }
    const associations = await prisma.workernames.findMany({
        where: {
            btc_address: p.address,
            user: user.user_id,
            OR: [{ status: "done" }, { status: "pending" }]
        }
    });
    return NextResponse.json(serialize(associations));
}