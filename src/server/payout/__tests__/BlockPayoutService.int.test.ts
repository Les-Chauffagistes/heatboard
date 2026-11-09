import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/Prisma";
import { COMMUNITY_POOL_ADDRESS as POOL } from "@/app/constants/columns";
import {
    BlockPayoutService,
    type DistributionElement,
    type HistoryPort,
} from "../BlockPayoutService";
import { ConflictError, NotFoundError, UpstreamError, ValidationError } from "../errors";

const NOW = new Date("2026-11-06T12:00:00.000Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);
const REWARD = 312_500_000n;
const ADDRESS = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const OTHER_ADDRESS = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2";
const MINED_AT = new Date("2026-11-04T16:59:23.000Z");

const uuid = () => crypto.randomUUID();

function makeService(distribution: DistributionElement[] | Error) {
    const history: HistoryPort = {
        getDistribution: vi.fn(async () => {
            if (distribution instanceof Error) throw distribution;
            return distribution;
        }),
    };
    const reward = { getRewardSatoshi: vi.fn(async () => REWARD) };
    const service = new BlockPayoutService({ db: prisma, history, reward, poolAddress: POOL, now: () => NOW });
    return { service, history, reward };
}

async function link(workername: string, user: string) {
    await prisma.workernames.create({
        data: { workername, user, btc_address: POOL, status: "done", code: "x" },
    });
}

const register = (service: BlockPayoutService, height: number, extra: Partial<{ idempotencyKey: string }> = {}) =>
    service.registerBlock({ height, minedAt: MINED_AT, idempotencyKey: extra.idempotencyKey ?? uuid() });

beforeEach(async () => {
    await prisma.$executeRawUnsafe(
        'TRUNCATE "paymentUpdate", "payment", "block", "workernames", "user" RESTART IDENTITY CASCADE',
    );
});

afterAll(() => prisma.$disconnect());

describe("registerBlock", () => {
    it("fige la répartition et crée une ligne par workername", async () => {
        const { service, history } = makeService([
            { workername: "asic1", part: 0.75 },
            { workername: "asic2", part: 0.25 },
        ]);
        await link("asic1", "u1");
        await prisma.user.create({ data: { id: "u1", address: ADDRESS, confirmedAt: daysAgo(5) } });

        const { block } = await register(service, 900_000);

        expect(history.getDistribution).toHaveBeenCalledWith(POOL, MINED_AT.toISOString());
        expect(block.rewardSatoshi).toBe(REWARD);
        const payments = await prisma.payment.findMany({ orderBy: { workername: "asc" } });
        expect(payments.map((p) => [p.workername, p.amountSatoshi])).toEqual([
            ["asic1", 234_375_000n],
            ["asic2", 78_125_000n],
        ]);
    });

    it("fige d'office l'adresse confirmée il y a moins de 30 jours et passe en pending", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await link("asic1", "u1");
        await prisma.user.create({ data: { id: "u1", address: ADDRESS, confirmedAt: daysAgo(30) } });

        await register(service, 900_000);

        const payment = await prisma.payment.findFirstOrThrow({ include: { updates: true } });
        expect(payment).toMatchObject({ user: "u1", status: "pending", btc_address: ADDRESS, addressFrozenAt: NOW });
        expect(payment.updates).toHaveLength(1);
        expect(payment.updates[0]).toMatchObject({ fromStatus: null, toStatus: "pending", actor: "system" });
    });

    it.each([
        ["confirmée il y a plus de 30 jours", { address: ADDRESS, confirmedAt: daysAgo(31) }],
        ["jamais confirmée", { address: ADDRESS, confirmedAt: null }],
        ["absente", { address: null, confirmedAt: null }],
    ])("laisse en waiting si l'adresse est %s", async (_label, userData) => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await link("asic1", "u1");
        await prisma.user.create({ data: { id: "u1", ...userData } });

        await register(service, 900_000);

        const payment = await prisma.payment.findFirstOrThrow();
        expect(payment).toMatchObject({ user: "u1", status: "waiting", btc_address: null, addressFrozenAt: null });
    });

    it("ne rattache à personne un workername non lié ou revendiqué par plusieurs comptes", async () => {
        const { service } = makeService([
            { workername: "orphan", part: 0.5 },
            { workername: "contested", part: 0.5 },
        ]);
        await link("contested", "u1");
        await link("contested", "u2");
        await prisma.workernames.create({
            data: { workername: "orphan", user: "u3", btc_address: POOL, status: "pending", code: "x" },
        });

        await register(service, 900_000);

        const payments = await prisma.payment.findMany();
        expect(payments).toHaveLength(2);
        for (const p of payments) expect(p).toMatchObject({ user: null, status: "waiting" });
    });

    it("ignore les liens vers une autre pool", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await prisma.workernames.create({
            data: { workername: "asic1", user: "u1", btc_address: "bc1other", status: "done", code: "x" },
        });
        await register(service, 900_000);
        expect((await prisma.payment.findFirstOrThrow()).user).toBeNull();
    });

    it("utilise la récompense fournie plutôt que bitcoin-service", async () => {
        const { service, reward } = makeService([{ workername: "asic1", part: 1 }]);
        await service.registerBlock({ height: 1, minedAt: MINED_AT, idempotencyKey: uuid(), rewardSatoshi: 100n });
        expect(reward.getRewardSatoshi).not.toHaveBeenCalled();
        expect((await prisma.payment.findFirstOrThrow()).amountSatoshi).toBe(100n);
    });

    it("rejoue sans effet de bord avec la même clé d'idempotence", async () => {
        const { service, history } = makeService([{ workername: "asic1", part: 1 }]);
        const key = uuid();
        const first = await register(service, 900_000, { idempotencyKey: key });
        const second = await register(service, 900_000, { idempotencyKey: key });

        expect(first.replayed).toBe(false);
        expect(second.replayed).toBe(true);
        expect(history.getDistribution).toHaveBeenCalledTimes(1);
        expect(await prisma.payment.count()).toBe(1);
    });

    it("renvoie 409 pour une même hauteur sous une autre clé, ou une clé réutilisée sur une autre hauteur", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        const key = uuid();
        await register(service, 900_000, { idempotencyKey: key });

        await expect(register(service, 900_000)).rejects.toBeInstanceOf(ConflictError);
        await expect(register(service, 900_001, { idempotencyKey: key })).rejects.toBeInstanceOf(ConflictError);
    });

    it("n'enregistre rien si history-server est indisponible ou renvoie une répartition vide", async () => {
        for (const outcome of [new Error("boom"), [] as DistributionElement[]]) {
            const { service } = makeService(outcome);
            await expect(register(service, 900_000)).rejects.toBeInstanceOf(UpstreamError);
        }
        expect(await prisma.block.count()).toBe(0);
        expect(await prisma.payment.count()).toBe(0);
    });

    it("annule toute la transaction si une ligne échoue", async () => {
        const { service } = makeService([
            { workername: "dup", part: 0.5 },
            { workername: "dup", part: 0.5 }, // viole (block, workername) unique
        ]);
        await expect(register(service, 900_000)).rejects.toThrow();
        expect(await prisma.block.count()).toBe(0);
        expect(await prisma.payment.count()).toBe(0);
        expect(await prisma.paymentUpdate.count()).toBe(0);
    });

    it("gère plusieurs blocks en simultané sans mélanger les paiements", async () => {
        const { service } = makeService([
            { workername: "asic1", part: 0.6 },
            { workername: "asic2", part: 0.4 },
        ]);
        await link("asic1", "u1");

        await Promise.all([900_000, 900_001, 900_002, 900_003].map((h) => register(service, h)));

        expect(await prisma.block.count()).toBe(4);
        const grouped = await prisma.payment.groupBy({ by: ["block"], _count: true });
        expect(grouped).toHaveLength(4);
        for (const g of grouped) expect(g._count).toBe(2);
    });

    it("n'enregistre qu'un seul block quand la même hauteur arrive en parallèle", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        const results = await Promise.allSettled(
            Array.from({ length: 5 }, () => register(service, 900_000)),
        );

        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        for (const r of results) {
            if (r.status === "rejected") expect(r.reason).toBeInstanceOf(ConflictError);
        }
        expect(await prisma.block.count()).toBe(1);
        expect(await prisma.payment.count()).toBe(1);
    });
});

describe("confirmAddress", () => {
    async function twoBlocksForUnconfirmedUser() {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await link("asic1", "u1");
        await prisma.user.create({ data: { id: "u1", address: null } });
        await register(service, 900_000);
        await register(service, 900_001);
        return service;
    }

    it("fige l'adresse sur les paiements de tous les blocks en attente et journalise", async () => {
        const service = await twoBlocksForUnconfirmedUser();

        const result = await service.confirmAddress("u1", ADDRESS);

        expect(result.frozenPayments).toBe(2);
        const payments = await prisma.payment.findMany({ include: { updates: { orderBy: { created_at: "asc" } } } });
        for (const p of payments) {
            expect(p).toMatchObject({ status: "pending", btc_address: ADDRESS, addressFrozenAt: NOW });
            expect(p.updates.map((u) => [u.fromStatus, u.toStatus, u.actor])).toEqual([
                [null, "waiting", "system"],
                ["waiting", "pending", "user:u1"],
            ]);
        }
        expect(await prisma.user.findUniqueOrThrow({ where: { id: "u1" } })).toMatchObject({
            address: ADDRESS,
            confirmedAt: NOW,
        });
    });

    it("reconfirme l'adresse existante sans la fournir", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await link("asic1", "u1");
        await prisma.user.create({ data: { id: "u1", address: ADDRESS, confirmedAt: daysAgo(40) } });
        await register(service, 900_000);

        await service.confirmAddress("u1");

        expect(await prisma.payment.findFirstOrThrow()).toMatchObject({ status: "pending", btc_address: ADDRESS });
    });

    it("ne modifie jamais l'adresse déjà figée d'un paiement lors d'un changement ultérieur", async () => {
        const service = await twoBlocksForUnconfirmedUser();
        await service.confirmAddress("u1", ADDRESS);

        const second = await service.confirmAddress("u1", OTHER_ADDRESS);

        expect(second.frozenPayments).toBe(0);
        for (const p of await prisma.payment.findMany()) expect(p.btc_address).toBe(ADDRESS);
        expect((await prisma.user.findUniqueOrThrow({ where: { id: "u1" } })).address).toBe(OTHER_ADDRESS);
    });

    it("ne touche ni aux paiements annulés ou envoyés, ni à ceux d'un autre membre", async () => {
        const service = await twoBlocksForUnconfirmedUser();
        const [first] = await prisma.payment.findMany({ orderBy: { block: "asc" } });
        await service.changeStatus(first.id, "cancelled", { actor: "admin" });
        await prisma.payment.create({ data: { block: 900_000, workername: "other", part: 0, amountSatoshi: 0n, user: "u2" } });

        await service.confirmAddress("u1", ADDRESS);

        const after = await prisma.payment.findMany();
        expect(after.find((p) => p.id === first.id)).toMatchObject({ status: "cancelled", btc_address: null });
        expect(after.find((p) => p.user === "u2")).toMatchObject({ status: "waiting", btc_address: null });
    });

    it("rejette une adresse invalide ou absente sans rien modifier", async () => {
        const service = await twoBlocksForUnconfirmedUser();

        await expect(service.confirmAddress("u1", "pas-une-adresse")).rejects.toBeInstanceOf(ValidationError);
        await expect(service.confirmAddress("u1")).rejects.toBeInstanceOf(ValidationError);

        expect((await prisma.user.findUniqueOrThrow({ where: { id: "u1" } })).address).toBeNull();
        expect(await prisma.payment.count({ where: { status: "pending" } })).toBe(0);
    });

    it("est idempotent sous appels concurrents", async () => {
        const service = await twoBlocksForUnconfirmedUser();

        await Promise.all([1, 2, 3].map(() => service.confirmAddress("u1", ADDRESS)));

        const updates = await prisma.paymentUpdate.findMany({ where: { toStatus: "pending" } });
        expect(updates).toHaveLength(2); // une seule transition par paiement
    });
});

describe("getRequiredAction", () => {
    it("indique ce qu'il manque au membre, et rien s'il n'y a rien à faire", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await link("asic1", "u1");

        expect(await service.getRequiredAction("u1")).toBeNull(); // pas de paiement

        await prisma.user.create({ data: { id: "u1" } });
        await register(service, 900_000);
        expect(await service.getRequiredAction("u1")).toBe("address_missing");

        await prisma.user.update({ where: { id: "u1" }, data: { address: ADDRESS, confirmedAt: daysAgo(31) } });
        expect(await service.getRequiredAction("u1")).toBe("address_confirmation_required");

        await service.confirmAddress("u1");
        expect(await service.getRequiredAction("u1")).toBeNull();
    });
});

describe("changeStatus", () => {
    async function pendingPayment() {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await link("asic1", "u1");
        await prisma.user.create({ data: { id: "u1", address: ADDRESS, confirmedAt: daysAgo(1) } });
        await register(service, 900_000);
        return { service, payment: await prisma.payment.findFirstOrThrow() };
    }

    it("journalise chaque transition, y compris les retours en arrière", async () => {
        const { service, payment } = await pendingPayment();
        const txid = "a".repeat(64);

        await service.changeStatus(payment.id, "sent", { actor: "admin", txid, note: "multi-sig" });
        await service.changeStatus(payment.id, "pending", { actor: "admin", note: "tx rejetée" });
        await service.changeStatus(payment.id, "cancelled", { actor: "admin" });

        const updates = await prisma.paymentUpdate.findMany({
            where: { payment_id: payment.id },
            orderBy: { created_at: "asc" },
        });
        expect(updates.map((u) => [u.fromStatus, u.toStatus])).toEqual([
            [null, "pending"],
            ["pending", "sent"],
            ["sent", "pending"],
            ["pending", "cancelled"],
        ]);
        expect(updates[1]).toMatchObject({ txid, note: "multi-sig", actor: "admin" });
        expect(await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).toMatchObject({
            status: "cancelled",
            txid,
        });
    });

    it("refuse une transition vers le même statut, un paiement inconnu, ou sent sans adresse", async () => {
        const { service, payment } = await pendingPayment();
        await expect(service.changeStatus(payment.id, "pending", { actor: "admin" })).rejects.toBeInstanceOf(ValidationError);
        await expect(service.changeStatus(uuid(), "sent", { actor: "admin" })).rejects.toBeInstanceOf(NotFoundError);

        const orphan = await prisma.payment.create({
            data: { block: 900_000, workername: "orphan", part: 0, amountSatoshi: 0n },
        });
        await expect(service.changeStatus(orphan.id, "sent", { actor: "admin" })).rejects.toBeInstanceOf(ValidationError);
        expect(await prisma.paymentUpdate.count({ where: { payment_id: orphan.id } })).toBe(0);
    });
});

describe("deleteBlock", () => {
    it("refuse de supprimer un block qui a des paiements, accepte sinon", async () => {
        const { service } = makeService([{ workername: "asic1", part: 1 }]);
        await register(service, 900_000);
        await expect(service.deleteBlock(900_000)).rejects.toBeInstanceOf(ConflictError);
        expect(await prisma.block.count()).toBe(1);

        await prisma.block.create({ data: { height: 1, minedAt: MINED_AT, rewardSatoshi: 1n, idempotencyKey: uuid() } });
        await service.deleteBlock(1);
        expect(await prisma.block.findUnique({ where: { height: 1 } })).toBeNull();
        await expect(service.deleteBlock(1)).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("listUserPayments", () => {
    it("ne renvoie que les paiements du membre, avec leur audit log", async () => {
        const { service } = makeService([
            { workername: "asic1", part: 0.5 },
            { workername: "asic2", part: 0.5 },
        ]);
        await link("asic1", "u1");
        await link("asic2", "u2");
        await register(service, 900_000);

        const payments = await service.listUserPayments("u1");

        expect(payments).toHaveLength(1);
        expect(payments[0]).toMatchObject({ workername: "asic1", user: "u1" });
        expect(payments[0].updates).toHaveLength(1);
        expect(payments[0].blockRef.height).toBe(900_000);
    });
});
