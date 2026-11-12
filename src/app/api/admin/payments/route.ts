import { NextResponse } from "next/server";
import * as z from "zod";
import { serialize } from "@/app/api/lib/serialize";
import { PaymentStatus } from "@/app/../../generated/prisma/enums";
import { prisma } from "@/server/Prisma";
import { adminHandler } from "@/server/payout/http";

const Query = z.object({
    block: z.coerce.number().int().positive().optional(),
    status: z.enum(Object.values(PaymentStatus) as [PaymentStatus, ...PaymentStatus[]]).optional(),
    user: z.string().min(1).optional(),
});

export async function GET(req: Request) {
    return adminHandler(req, async () => {
        const query = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
        const payments = await prisma.payment.findMany({
            where: { block: query.block, status: query.status, user: query.user },
            orderBy: [{ block: "desc" }, { workername: "asc" }],
        });
        return NextResponse.json(serialize(payments));
    });
}
