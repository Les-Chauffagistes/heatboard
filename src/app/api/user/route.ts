import { NextResponse } from "next/server";
import { prisma } from "@/server/Prisma";
import * as z from "zod";
import { getPayoutService } from "@/server/payout";
import { handle } from "@/server/payout/http";
import { getMe } from "@/lib/auth";
import { getServerCookieHeader } from "@/lib/auth.server";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const baseUser = await getMe(await getServerCookieHeader());
        if (!baseUser) return NextResponse.json(null, { status: 401 });

        const heatboardUser = await prisma.user.upsert({
            where: { id: baseUser.user_id },
            create: { id: baseUser.user_id },
            update: {},
        });

        return NextResponse.json({ id: heatboardUser.id, address: heatboardUser.address });
    } catch (e) {
        logger.error(e);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}

const PatchPayload = z.object({ address: z.string().min(1) });

/** Seule l'adresse de paiement est modifiable ; la modifier la confirme (`confirmedAt` posé côté serveur). */
export async function PATCH(req: Request) {
    return handle(async () => {
        const baseUser = await getMe(await getServerCookieHeader());
        if (!baseUser) return NextResponse.json({ error: "Auth required" }, { status: 401 });

        const { address } = PatchPayload.parse(await req.json());
        await getPayoutService().confirmAddress(baseUser.user_id, address);
        return NextResponse.json({ ok: true });
    });
}
