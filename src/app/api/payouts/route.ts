import { NextResponse } from "next/server";
import { serialize } from "@/app/api/lib/serialize";
import { getMe } from "@/lib/auth";
import { getServerCookieHeader } from "@/lib/auth.server";
import { getPayoutService } from "@/server/payout";
import { handle } from "@/server/payout/http";

/** Paiements de blocks du membre connecté, avec audit log, et action requise de sa part. */
export async function GET() {
    return handle(async () => {
        const me = await getMe(await getServerCookieHeader());
        if (!me) return NextResponse.json({ error: "Auth required" }, { status: 401 });

        const service = getPayoutService();
        const [payments, requiredAction] = await Promise.all([
            service.listUserPayments(me.user_id),
            service.getRequiredAction(me.user_id),
        ]);
        return NextResponse.json(serialize({ requiredAction, payments }));
    });
}
