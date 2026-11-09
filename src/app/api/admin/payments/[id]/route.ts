import { NextResponse } from "next/server";
import * as z from "zod";
import { serialize } from "@/app/api/lib/serialize";
import { PaymentStatus } from "@/app/../../generated/prisma/enums";
import { prisma } from "@/server/Prisma";
import { getPayoutService } from "@/server/payout";
import { NotFoundError } from "@/server/payout/errors";
import { adminHandler } from "@/server/payout/http";

type Ctx = { params: Promise<{ id: string }> };

const Payload = z.object({
    status: z.enum(Object.values(PaymentStatus) as [PaymentStatus, ...PaymentStatus[]]),
    note: z.string().max(500).optional(),
    txid: z.string().regex(/^[0-9a-fA-F]{64}$/, "txid invalide").optional(),
});

export async function GET(req: Request, { params }: Ctx) {
    return adminHandler(req, async () => {
        const id = z.uuid().parse((await params).id);
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: { updates: { orderBy: { created_at: "asc" } } },
        });
        if (!payment) throw new NotFoundError(`Paiement ${id} introuvable`);
        return NextResponse.json(serialize(payment));
    });
}

/** Change le statut (toute transition permise, journalisée). */
export async function PATCH(req: Request, { params }: Ctx) {
    return adminHandler(req, async () => {
        const id = z.uuid().parse((await params).id);
        const { status, note, txid } = Payload.parse(await req.json());
        const payment = await getPayoutService().changeStatus(id, status, { actor: "admin", note, txid });
        return NextResponse.json(serialize(payment));
    });
}
