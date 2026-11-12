import { NextResponse } from "next/server";
import * as z from "zod";
import { serialize } from "@/app/api/lib/serialize";
import { prisma } from "@/server/Prisma";
import { getPayoutService } from "@/server/payout";
import { NotFoundError } from "@/server/payout/errors";
import { adminHandler } from "@/server/payout/http";

type Ctx = { params: Promise<{ height: string }> };
const Height = z.coerce.number().int().positive();

export async function GET(req: Request, { params }: Ctx) {
    return adminHandler(req, async () => {
        const height = Height.parse((await params).height);
        const block = await prisma.block.findUnique({
            where: { height },
            include: { payments: { orderBy: { workername: "asc" } } },
        });
        if (!block) throw new NotFoundError(`Block ${height} introuvable`);
        return NextResponse.json(serialize(block));
    });
}

/** Refusé (409) si le block a des paiements. */
export async function DELETE(req: Request, { params }: Ctx) {
    return adminHandler(req, async () => {
        await getPayoutService().deleteBlock(Height.parse((await params).height));
        return new NextResponse(null, { status: 204 });
    });
}
