import { NextResponse } from "next/server";
import * as z from "zod";
import { logger } from "@/lib/logger";
import { isAdminRequest } from "./adminAuth";
import { PayoutError } from "./errors";

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** Exécute un handler admin : 401 sans clé valide, erreurs métier mappées sur leur statut HTTP. */
export async function adminHandler(req: Request, handler: () => Promise<NextResponse>): Promise<NextResponse> {
    if (!isAdminRequest(req)) return unauthorized();
    return handle(handler);
}

export async function handle(handler: () => Promise<NextResponse>): Promise<NextResponse> {
    try {
        return await handler();
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data structure", issues: z.treeifyError(e) }, { status: 400 });
        }
        if (e instanceof SyntaxError) {
            return NextResponse.json({ error: "Parsing JSON failed" }, { status: 400 });
        }
        if (e instanceof PayoutError) {
            if (e.status >= 500) logger.error(e.cause ?? e);
            return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
        }
        logger.error(e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
