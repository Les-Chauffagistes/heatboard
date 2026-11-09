import { NextResponse } from "next/server";
import * as z from "zod";
import { getMe } from "@/lib/auth";
import { getServerCookieHeader } from "@/lib/auth.server";
import { getPayoutService } from "@/server/payout";
import { handle } from "@/server/payout/http";

const Payload = z.object({ address: z.string().min(1).optional() });

/**
 * Enregistre une nouvelle adresse de paiement, ou reconfirme l'actuelle (sans `address`).
 * Dans les deux cas l'adresse est confirmée et figée sur les paiements en attente.
 */
export async function POST(req: Request) {
    return handle(async () => {
        const me = await getMe(await getServerCookieHeader());
        if (!me) return NextResponse.json({ error: "Auth required" }, { status: 401 });

        const { address } = Payload.parse(await req.json().catch(() => ({})));
        const result = await getPayoutService().confirmAddress(me.user_id, address);
        return NextResponse.json(result);
    });
}
