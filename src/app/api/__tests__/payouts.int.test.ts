import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const distribution = vi.hoisted(() => ({ current: [] as { workername: string; part: number }[], fail: false }));
const session = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@/server/payout/adapters", () => ({
    historyAdapter: () => ({
        getDistribution: async () => {
            if (distribution.fail) throw new Error("history down");
            return distribution.current;
        },
    }),
    rewardAdapter: () => ({ getRewardSatoshi: async () => 312_500_000n }),
}));
vi.mock("@/lib/auth.server", () => ({ getServerCookieHeader: async () => "" }));
vi.mock("@/lib/auth", () => ({
    getMe: async () => (session.userId ? { user_id: session.userId, pseudo: "p" } : null),
}));

import { prisma } from "@/server/Prisma";
import { COMMUNITY_POOL_ADDRESS as POOL } from "@/app/constants/columns";
import { GET as listBlocks, POST as createBlock } from "../admin/blocks/route";
import { DELETE as deleteBlock, GET as getBlock } from "../admin/blocks/[height]/route";
import { GET as listPayments } from "../admin/payments/route";
import { GET as getPayment, PATCH as patchPayment } from "../admin/payments/[id]/route";
import { GET as myPayouts } from "../payouts/route";
import { POST as confirmAddress } from "../payouts/address/route";
import { PATCH as patchUser } from "../user/route";

const KEY = "test-admin-key";
const ADDRESS = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const MINED_AT = "2026-11-04T16:59:23.000Z";

const admin = (method: string, body?: unknown, extra: Record<string, string> = {}) =>
    new Request("http://localhost/api/admin", {
        method,
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
const member = (body?: unknown) =>
    new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body ?? {}) });
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

beforeEach(async () => {
    process.env.ADMIN_API_KEY = KEY;
    process.env.HISTORY_API_URL = "http://history";
    process.env.BITCOIN_API_URL = "http://bitcoin";
    distribution.current = [{ workername: "asic1", part: 0.75 }, { workername: "asic2", part: 0.25 }];
    distribution.fail = false;
    session.userId = null;
    await prisma.$executeRawUnsafe(
        'TRUNCATE "paymentUpdate", "payment", "block", "workernames", "user" RESTART IDENTITY CASCADE',
    );
});

afterAll(() => prisma.$disconnect());

describe("auth admin", () => {
    it("refuse sans clé ou avec une mauvaise clé (401) sur chaque route", async () => {
        const noKey = new Request("http://localhost/api/admin", { method: "GET" });
        const wrong = new Request("http://localhost/api/admin", { headers: { Authorization: "Bearer nope" } });
        for (const req of [noKey, wrong]) {
            expect((await listBlocks(req)).status).toBe(401);
            expect((await createBlock(req)).status).toBe(401);
            expect((await listPayments(req)).status).toBe(401);
            expect((await getBlock(req, ctx({ height: "1" }))).status).toBe(401);
            expect((await deleteBlock(req, ctx({ height: "1" }))).status).toBe(401);
            expect((await patchPayment(req, ctx({ id: crypto.randomUUID() }))).status).toBe(401);
        }
    });
});

describe("POST /api/admin/blocks", () => {
    it("crée le block (201), puis rejoue la même clé d'idempotence (200)", async () => {
        const key = crypto.randomUUID();
        const body = { height: 900_000, minedAt: MINED_AT };

        const created = await createBlock(admin("POST", body, { "Idempotency-Key": key }));
        expect(created.status).toBe(201);
        expect(await created.json()).toMatchObject({ height: 900_000, rewardSatoshi: 312_500_000 });

        const replay = await createBlock(admin("POST", body, { "Idempotency-Key": key }));
        expect(replay.status).toBe(200);
        expect(await prisma.payment.count()).toBe(2);
    });

    it("répond 409 pour une même hauteur sous une autre clé", async () => {
        const body = { height: 900_000, minedAt: MINED_AT };
        await createBlock(admin("POST", body));
        const res = await createBlock(admin("POST", body));
        expect(res.status).toBe(409);
    });

    it("répond 502 et n'enregistre rien si history-server est indisponible", async () => {
        distribution.fail = true;
        const res = await createBlock(admin("POST", { height: 900_000, minedAt: MINED_AT }));
        expect(res.status).toBe(502);
        expect(await prisma.block.count()).toBe(0);
    });

    it.each([
        ["date sans fuseau", { height: 1, minedAt: "2026-11-04T16:59:23" }],
        ["hauteur négative", { height: -1, minedAt: MINED_AT }],
        ["champ manquant", { minedAt: MINED_AT }],
    ])("répond 400 pour %s", async (_label, body) => {
        expect((await createBlock(admin("POST", body))).status).toBe(400);
    });

    it("répond 400 pour une clé d'idempotence qui n'est pas un uuid ou un JSON invalide", async () => {
        const badKey = await createBlock(admin("POST", { height: 1, minedAt: MINED_AT }, { "Idempotency-Key": "abc" }));
        expect(badKey.status).toBe(400);
        const badJson = new Request("http://localhost", {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}` },
            body: "{",
        });
        expect((await createBlock(badJson)).status).toBe(400);
    });
});

describe("lecture et suppression des blocks", () => {
    it("liste, détaille, et refuse de supprimer un block qui a des paiements (409)", async () => {
        await createBlock(admin("POST", { height: 900_000, minedAt: MINED_AT }));

        const list = await (await listBlocks(admin("GET"))).json();
        expect(list).toHaveLength(1);
        expect(list[0]._count.payments).toBe(2);

        const detail = await (await getBlock(admin("GET"), ctx({ height: "900000" }))).json();
        expect(detail.payments.map((p: { workername: string }) => p.workername)).toEqual(["asic1", "asic2"]);

        expect((await deleteBlock(admin("DELETE"), ctx({ height: "900000" }))).status).toBe(409);
        expect((await getBlock(admin("GET"), ctx({ height: "1" }))).status).toBe(404);
    });

    it("supprime un block sans paiement (204)", async () => {
        await prisma.block.create({
            data: { height: 5, minedAt: MINED_AT, rewardSatoshi: 1n, idempotencyKey: crypto.randomUUID() },
        });
        expect((await deleteBlock(admin("DELETE"), ctx({ height: "5" }))).status).toBe(204);
        expect(await prisma.block.count()).toBe(0);
    });
});

describe("paiements côté admin", () => {
    it("filtre par block, statut et membre, et change un statut avec audit log", async () => {
        await prisma.workernames.create({ data: { workername: "asic1", user: "u1", btc_address: POOL, status: "done", code: "x" } });
        await createBlock(admin("POST", { height: 900_000, minedAt: MINED_AT }));

        const byUser = await (await listPayments(new Request("http://x/?user=u1", { headers: { Authorization: `Bearer ${KEY}` } }))).json();
        expect(byUser).toHaveLength(1);
        const [payment] = byUser;

        const txid = "b".repeat(64);
        // Sans adresse figée, `sent` est refusé ; les autres transitions restent permises.
        expect((await patchPayment(admin("PATCH", { status: "sent", txid }), ctx({ id: payment.id }))).status).toBe(422);
        expect((await patchPayment(admin("PATCH", { status: "pending", note: "ok" }), ctx({ id: payment.id }))).status).toBe(200);

        await prisma.payment.update({ where: { id: payment.id }, data: { btc_address: ADDRESS } });
        const sent = await patchPayment(admin("PATCH", { status: "sent", txid }), ctx({ id: payment.id }));
        expect(sent.status).toBe(200);

        const detail = await (await getPayment(admin("GET"), ctx({ id: payment.id }))).json();
        expect(detail.status).toBe("sent");
        expect(detail.updates.at(-1)).toMatchObject({ toStatus: "sent", actor: "admin", txid });

        const filtered = await (await listPayments(new Request("http://x/?status=sent&block=900000", { headers: { Authorization: `Bearer ${KEY}` } }))).json();
        expect(filtered).toHaveLength(1);
    });

    it("rejette un statut ou un txid invalide (400) et un paiement inconnu (404)", async () => {
        const id = crypto.randomUUID();
        expect((await patchPayment(admin("PATCH", { status: "paid" }), ctx({ id }))).status).toBe(400);
        expect((await patchPayment(admin("PATCH", { status: "sent", txid: "zz" }), ctx({ id }))).status).toBe(400);
        expect((await patchPayment(admin("PATCH", { status: "sent" }), ctx({ id }))).status).toBe(404);
        expect((await getPayment(admin("GET"), ctx({ id: "not-a-uuid" }))).status).toBe(400);
    });
});

describe("routes membre", () => {
    it("exigent une session (401)", async () => {
        expect((await myPayouts()).status).toBe(401);
        expect((await confirmAddress(member({ address: ADDRESS }))).status).toBe(401);
        expect((await patchUser(member({ address: ADDRESS }))).status).toBe(401);
    });

    it("parcours complet : block annoncé, adresse demandée, confirmée, paiement pending", async () => {
        await prisma.workernames.create({ data: { workername: "asic1", user: "u1", btc_address: POOL, status: "done", code: "x" } });
        await createBlock(admin("POST", { height: 900_000, minedAt: MINED_AT }));
        session.userId = "u1";

        const before = await (await myPayouts()).json();
        expect(before.requiredAction).toBe("address_missing");
        expect(before.payments).toHaveLength(1);
        expect(before.payments[0]).toMatchObject({ workername: "asic1", status: "waiting", amountSatoshi: 234_375_000 });

        expect((await confirmAddress(member({ address: "nope" }))).status).toBe(422);
        expect((await confirmAddress(member({ address: ADDRESS }))).status).toBe(200);

        const after = await (await myPayouts()).json();
        expect(after.requiredAction).toBeNull();
        expect(after.payments[0]).toMatchObject({ status: "pending", btc_address: ADDRESS });
        expect(after.payments[0].updates.map((u: { toStatus: string }) => u.toStatus)).toEqual(["waiting", "pending"]);
    });

    it("n'expose jamais les paiements des autres membres", async () => {
        await prisma.workernames.create({ data: { workername: "asic1", user: "u1", btc_address: POOL, status: "done", code: "x" } });
        await createBlock(admin("POST", { height: 900_000, minedAt: MINED_AT }));
        session.userId = "u2";
        expect((await (await myPayouts()).json()).payments).toEqual([]);
    });

    it("PATCH /api/user n'accepte que l'adresse et pose confirmedAt côté serveur", async () => {
        session.userId = "u1";
        const forged = await patchUser(member({ address: ADDRESS, confirmedAt: "2000-01-01T00:00:00Z", id: "u9" }));
        expect(forged.status).toBe(200);

        const user = await prisma.user.findUniqueOrThrow({ where: { id: "u1" } });
        expect(user.address).toBe(ADDRESS);
        expect(Date.now() - user.confirmedAt!.getTime()).toBeLessThan(10_000);
        expect(await prisma.user.findUnique({ where: { id: "u9" } })).toBeNull();

        expect((await patchUser(member({ confirmedAt: new Date().toISOString() }))).status).toBe(400);
    });
});
