import { Prisma, PrismaClient } from "@/app/../../generated/prisma/client";
import { PaymentStatus } from "@/app/../../generated/prisma/enums";
import { amountForPart } from "./amounts";
import { isConfirmationFresh } from "./addressPolicy";
import { isValidBtcAddress } from "./btcAddress";
import { ConflictError, NotFoundError, UpstreamError, ValidationError } from "./errors";

/** Élément de répartition du travail renvoyé par history-server à une date donnée. */
export interface DistributionElement {
    workername: string;
    /** Fraction 0-1 du travail de la pool (la somme des parts vaut 1). */
    part: number | string;
}

export interface HistoryPort {
    /** Répartition du travail de la pool à `at` (ISO 8601). */
    getDistribution(poolAddress: string, at: string): Promise<DistributionElement[]>;
}

export interface RewardPort {
    /** Subsidy distribuée (hors frais) pour le block miné à `minedAt`, en satoshis. */
    getRewardSatoshi(height: number, minedAt: Date): Promise<bigint>;
}

export interface BlockPayoutDeps {
    db: PrismaClient;
    history: HistoryPort;
    reward: RewardPort;
    poolAddress: string;
    now?: () => Date;
}

export interface RegisterBlockInput {
    height: number;
    minedAt: Date;
    idempotencyKey: string;
    /** Prioritaire sur `RewardPort` si fourni. */
    rewardSatoshi?: bigint;
}

export interface StatusChangeInput {
    actor: string;
    note?: string;
    txid?: string;
}

/** Action requise d'un membre sur ses paiements. */
export type RequiredAction = "address_missing" | "address_confirmation_required";

type Tx = Prisma.TransactionClient;

export class BlockPayoutService {
    private readonly db: PrismaClient;
    private readonly history: HistoryPort;
    private readonly reward: RewardPort;
    private readonly poolAddress: string;
    private readonly now: () => Date;

    constructor(deps: BlockPayoutDeps) {
        this.db = deps.db;
        this.history = deps.history;
        this.reward = deps.reward;
        this.poolAddress = deps.poolAddress;
        this.now = deps.now ?? (() => new Date());
    }

    /**
     * Enregistre un block et fige la répartition par workername.
     * Idempotent sur `idempotencyKey` ; 409 si la hauteur existe déjà sous une autre clé.
     * Si history-server ou le fournisseur de récompense échoue, rien n'est enregistré.
     */
    async registerBlock(input: RegisterBlockInput) {
        const replay = await this.db.block.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (replay) {
            if (replay.height !== input.height) {
                throw new ConflictError("Cette clé d'idempotence est déjà associée à un autre block");
            }
            return { block: replay, replayed: true };
        }
        if (await this.db.block.findUnique({ where: { height: input.height } })) {
            throw new ConflictError(`Le block ${input.height} est déjà enregistré`);
        }

        const rewardSatoshi = input.rewardSatoshi ?? await this.fetchReward(input);
        const distribution = await this.fetchDistribution(input.minedAt);
        const now = this.now();

        try {
            const block = await this.db.$transaction(async (tx) => {
                const created = await tx.block.create({
                    data: {
                        height: input.height,
                        minedAt: input.minedAt,
                        rewardSatoshi,
                        idempotencyKey: input.idempotencyKey,
                    },
                });
                await this.createPayments(tx, created.height, rewardSatoshi, distribution, now);
                return created;
            });
            return { block, replayed: false };
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                // Course avec une requête concurrente : on rejoue ou on refuse proprement.
                const existing = await this.db.block.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
                if (existing?.height === input.height) return { block: existing, replayed: true };
                throw new ConflictError(`Le block ${input.height} est déjà enregistré`);
            }
            throw e;
        }
    }

    /** Supprime un block, uniquement s'il n'a aucun paiement (pas de cascade). */
    async deleteBlock(height: number) {
        const block = await this.db.block.findUnique({ where: { height }, include: { _count: { select: { payments: true } } } });
        if (!block) throw new NotFoundError(`Block ${height} introuvable`);
        if (block._count.payments > 0) {
            throw new ConflictError(`Le block ${height} a des paiements et ne peut pas être supprimé`);
        }
        await this.db.block.delete({ where: { height } });
    }

    /**
     * Change le statut d'un paiement (toute transition est permise, y compris les retours en arrière)
     * et journalise le changement dans la même transaction.
     */
    async changeStatus(paymentId: string, toStatus: PaymentStatus, { actor, note, txid }: StatusChangeInput) {
        return this.db.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where: { id: paymentId } });
            if (!payment) throw new NotFoundError(`Paiement ${paymentId} introuvable`);
            if (payment.status === toStatus) {
                throw new ValidationError(`Le paiement est déjà au statut ${toStatus}`);
            }
            if (toStatus === "sent" && !payment.btc_address) {
                throw new ValidationError("Impossible de marquer comme envoyé un paiement sans adresse figée");
            }
            const updated = await tx.payment.update({
                where: { id: paymentId },
                data: { status: toStatus, ...(txid !== undefined ? { txid } : {}) },
            });
            await tx.paymentUpdate.create({
                data: { payment_id: paymentId, fromStatus: payment.status, toStatus, actor, note, txid },
            });
            return updated;
        });
    }

    /**
     * Enregistre (ou reconfirme) l'adresse de paiement d'un membre : changer d'adresse vaut confirmation.
     * Fige ensuite l'adresse sur tous ses paiements pas encore figés et les passe à `pending`.
     */
    async confirmAddress(userId: string, address?: string) {
        const now = this.now();
        return this.db.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            const target = address ?? user?.address;
            if (!target) throw new ValidationError("Aucune adresse de paiement renseignée");
            if (!isValidBtcAddress(target)) throw new ValidationError("Adresse Bitcoin invalide");

            await tx.user.upsert({
                where: { id: userId },
                create: { id: userId, address: target, confirmedAt: now },
                update: { address: target, confirmedAt: now },
            });

            const toFreeze = await tx.payment.findMany({
                where: { user: userId, addressFrozenAt: null, status: "waiting" },
                select: { id: true },
            });
            await Promise.all(toFreeze.map(async ({ id }) => {
                // Conditionnel : si une requête concurrente l'a déjà figé, on ne le refait pas.
                const { count } = await tx.payment.updateMany({
                    where: { id, addressFrozenAt: null, status: "waiting" },
                    data: { btc_address: target, addressFrozenAt: now, status: "pending" },
                });
                if (count === 1) {
                    await tx.paymentUpdate.create({
                        data: {
                            payment_id: id,
                            fromStatus: "waiting",
                            toStatus: "pending",
                            actor: `user:${userId}`,
                            note: "Adresse de paiement confirmée",
                        },
                    });
                }
            }));
            return { address: target, frozenPayments: toFreeze.length };
        });
    }

    /** Ce que le membre doit faire pour être payé (vide si rien). */
    async getRequiredAction(userId: string): Promise<RequiredAction | null> {
        const awaiting = await this.db.payment.count({
            where: { user: userId, addressFrozenAt: null, status: "waiting" },
        });
        if (awaiting === 0) return null;
        const user = await this.db.user.findUnique({ where: { id: userId } });
        if (!user?.address) return "address_missing";
        return isConfirmationFresh(user.confirmedAt, this.now()) ? null : "address_confirmation_required";
    }

    /** Paiements d'un membre avec leur audit log, du plus récent au plus ancien. */
    async listUserPayments(userId: string) {
        return this.db.payment.findMany({
            where: { user: userId },
            orderBy: [{ block: "desc" }, { workername: "asc" }],
            include: { blockRef: true, updates: { orderBy: { created_at: "asc" } } },
        });
    }

    private async fetchReward(input: RegisterBlockInput): Promise<bigint> {
        try {
            return await this.reward.getRewardSatoshi(input.height, input.minedAt);
        } catch (e) {
            throw new UpstreamError("Récompense du block indisponible", e);
        }
    }

    private async fetchDistribution(minedAt: Date): Promise<DistributionElement[]> {
        let distribution: DistributionElement[];
        try {
            distribution = await this.history.getDistribution(this.poolAddress, minedAt.toISOString());
        } catch (e) {
            throw new UpstreamError("history-server indisponible", e);
        }
        if (distribution.length === 0) {
            throw new UpstreamError("history-server n'a renvoyé aucune répartition pour cette date");
        }
        return distribution;
    }

    private async createPayments(tx: Tx, height: number, rewardSatoshi: bigint, distribution: DistributionElement[], now: Date) {
        const names = distribution.map((d) => d.workername);
        const links = await tx.workernames.findMany({
            where: { btc_address: this.poolAddress, status: "done", workername: { in: names } },
        });
        // Un workername revendiqué par plusieurs comptes est ambigu : on ne paie personne.
        const ownersByName = new Map<string, Set<string>>();
        for (const l of links) {
            ownersByName.set(l.workername, (ownersByName.get(l.workername) ?? new Set()).add(l.user));
        }
        const uniqueOwner = (name: string) => {
            const owners = ownersByName.get(name);
            return owners?.size === 1 ? [...owners][0] : null;
        };

        const ownerIds = [...new Set(names.map(uniqueOwner).filter((u): u is string => u !== null))];
        const users = new Map((await tx.user.findMany({ where: { id: { in: ownerIds } } })).map((u) => [u.id, u]));

        await Promise.all(distribution.map(async (element) => {
            const owner = uniqueOwner(element.workername);
            const user = owner ? users.get(owner) : undefined;
            const freeze = !!user?.address && isConfirmationFresh(user.confirmedAt, now);
            const status: PaymentStatus = freeze ? "pending" : "waiting";

            const payment = await tx.payment.create({
                data: {
                    block: height,
                    workername: element.workername,
                    part: new Prisma.Decimal(element.part),
                    amountSatoshi: amountForPart(rewardSatoshi, element.part),
                    user: owner,
                    status,
                    ...(freeze ? { btc_address: user!.address, addressFrozenAt: now } : {}),
                },
            });
            await tx.paymentUpdate.create({
                data: {
                    payment_id: payment.id,
                    fromStatus: null,
                    toStatus: status,
                    actor: "system",
                    note: creationNote(freeze, owner),
                },
            });
        }));
    }
}

function creationNote(freeze: boolean, owner: string | null): string {
    if (freeze) return "Block enregistré, adresse déjà confirmée et figée";
    if (owner) return "Block enregistré, en attente de l'adresse ou de sa confirmation";
    return "Block enregistré, workername non lié à un compte : aucun paiement possible";
}
