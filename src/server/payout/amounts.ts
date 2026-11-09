import { Prisma } from "@/app/../../generated/prisma/client";

/**
 * Montant (en satoshis) d'une part de la récompense, tronqué à l'unité inférieure.
 * `part` est la fraction (0–1) du travail fournie par le workername.
 * Le calcul est fait en décimal exact pour éviter toute dérive des flottants.
 */
export function amountForPart(rewardSatoshi: bigint, part: number | string | Prisma.Decimal): bigint {
    const amount = new Prisma.Decimal(part).mul(rewardSatoshi.toString()).floor();
    return BigInt(amount.toFixed(0));
}
