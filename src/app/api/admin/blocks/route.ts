import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import * as z from "zod";
import { serialize } from "@/app/api/lib/serialize";
import { prisma } from "@/server/Prisma";
import { getPayoutService } from "@/server/payout";
import { adminHandler } from "@/server/payout/http";

const Payload = z.object({
    height: z.number().int().positive(),
    minedAt: z.iso.datetime({ offset: true }),
    /** Subsidy en satoshis ; sinon récupérée auprès de bitcoin-service. */
    rewardSatoshi: z.number().int().positive().optional(),
});

export async function GET(req: Request) {
    return adminHandler(req, async () => {
        const blocks = await prisma.block.findMany({
            orderBy: { height: "desc" },
            include: { _count: { select: { payments: true } } },
        });
        return NextResponse.json(serialize(blocks));
    });
}

/** Enregistre un block. `Idempotency-Key` (uuid) permet de rejouer la requête sans effet de bord. */
export async function POST(req: Request) {
    return adminHandler(req, async () => {
        const data = Payload.parse(await req.json());
        const idempotencyKey = z.uuid().parse(req.headers.get("Idempotency-Key") ?? randomUUID());

        const { block, replayed } = await getPayoutService().registerBlock({
            height: data.height,
            minedAt: new Date(data.minedAt),
            idempotencyKey,
            rewardSatoshi: data.rewardSatoshi === undefined ? undefined : BigInt(data.rewardSatoshi),
        });
        return NextResponse.json(serialize(block), { status: replayed ? 200 : 201 });
    });
}
