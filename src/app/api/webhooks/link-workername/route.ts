import { prisma } from "@/server/Prisma";
import { NextResponse } from "next/server";
import * as z from "zod";
import { websockets } from "@/server/websockets";

const Payload = z.object({
    user: z.string(),
    worker: z.string(),
    code: z.string(),
    lastSeen: z.string()
})


export async function POST(req: Request) {
    let data;
    try {
        data = await req.json();
        data = Payload.parse(data)
    } catch (e) {
        if (e instanceof SyntaxError) return NextResponse.json({ ok: false, error: "Parsing JSON failed" }, { status: 400 })
        if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Invalid data structure" }, { status: 400 })
        console.warn(e)
        return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
    }
    const auth = req.headers.get("Authorization");
    console.debug(auth);
    console.debug(data);
    if (auth == "Bearer " + process.env.POOL_TOKEN) {
        const config = await prisma.workernames.findFirst({
            where: {
                code: data.code,
                workername: data.worker,
                btc_address: data.user
            }
        })
        if (config) {
            // Valider la config
            config.status = "done"
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

            const user = await prisma.user.findFirst({
                where: {
                    id: config.user
                }
            })

            if (user) {
                try {
                    const userWs = websockets.get(user.id.toString())
                    if (userWs) {
                        userWs.send(JSON.stringify({
                            "ready": true
                        }))
                        console.log("sent")
                    } else {
                        console.warn("User not connected")
                    }

                } catch (e) {
                    console.warn(e)
                }
            } else {
                console.warn("User not found")
            }
        } else {
            console.log("config not found")
            return NextResponse.json({ ok: false })
        }
        return NextResponse.json({ ok: true });
    } else {
        console.warn("Auth failed");
        return NextResponse.json({ ok: false, error: "Auth failed" });
    }
}