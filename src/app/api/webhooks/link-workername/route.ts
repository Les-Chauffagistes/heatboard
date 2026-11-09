import { prisma } from "@/server/Prisma";
import { NextResponse } from "next/server";
import * as z from "zod";
import { websockets } from "@/server/websockets";
import { logger } from "@/lib/logger";

const Payload = z.object({
    user: z.string(),
    worker: z.string(),
    code: z.string(),
    lastSeen: z.string()
})

type PayloadData = z.infer<typeof Payload>;

async function parsePayload(req: Request): Promise<{ data: PayloadData } | { error: NextResponse }> {
    try {
        return { data: Payload.parse(await req.json()) };
    } catch (e) {
        if (e instanceof SyntaxError) return { error: NextResponse.json({ ok: false, error: "Parsing JSON failed" }, { status: 400 }) };
        if (e instanceof z.ZodError) return { error: NextResponse.json({ ok: false, error: "Invalid data structure" }, { status: 400 }) };
        logger.error(e)
        return { error: NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 }) };
    }
}

/** Prévient le client WebSocket du membre que son mineur est connecté. */
function notifyUser(userId: string) {
    try {
        const userWs = websockets.get(userId)
        if (!userWs) {
            logger.warn("User not connected")
            return
        }
        if (userWs.readyState !== userWs.OPEN) {
            // `send` sur un socket fermé ne lève aucune erreur : on ne logge pas "sent" à tort.
            logger.warn("User socket is not open (readyState " + userWs.readyState + ")")
            websockets.delete(userId)
            return
        }
        userWs.send(JSON.stringify({
            "ready": true
        }))
        logger.info("sent")
    } catch (e) {
        logger.error(e)
    }
}

async function validateConfig(config: { btc_address: string, workername: string, user: string }, data: PayloadData) {
    await prisma.workernames.updateMany({
        where: {
            code: data.code,
            workername: data.worker,
            btc_address: data.user
        },
        data: {
            status: "done"
        }
    })

    // Supprimer les autres configs démarrées pour ce workername
    await prisma.workernames.deleteMany({
        where: {
            btc_address: config.btc_address,
            workername: config.workername,
            NOT: {
                user: config.user
            }
        }
    })
}

export async function POST(req: Request) {
    const parsed = await parsePayload(req);
    if ("error" in parsed) return parsed.error;
    const { data } = parsed;

    const auth = req.headers.get("Authorization");
    logger.debug(auth);
    logger.debug(data);
    if (auth != "Bearer " + process.env.POOL_TOKEN) {
        logger.warn("Auth failed");
        return NextResponse.json({ ok: false, error: "Auth failed" });
    }

    const config = await prisma.workernames.findFirst({
        where: {
            code: data.code,
            workername: data.worker,
            btc_address: data.user
        }
    })
    if (!config) {
        logger.info("config not found")
        return NextResponse.json({ ok: false })
    }

    // Valider la config
    await validateConfig(config, data);

    const user = await prisma.user.findFirst({
        where: {
            id: config.user
        }
    })
    if (user) {
        notifyUser(user.id.toString())
    } else {
        logger.warn("User not found")
    }
    return NextResponse.json({ ok: true });
}
