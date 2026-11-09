import { timingSafeEqual } from "node:crypto";

/** Vérifie `Authorization: Bearer <ADMIN_API_KEY>` en temps constant. Refuse si la clé n'est pas configurée. */
export function isAdminRequest(req: Request, expectedKey: string | undefined = process.env.ADMIN_API_KEY): boolean {
    if (!expectedKey) return false;
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return false;

    const provided = Buffer.from(header.slice("Bearer ".length));
    const expected = Buffer.from(expectedKey);
    return provided.length === expected.length && timingSafeEqual(provided, expected);
}
