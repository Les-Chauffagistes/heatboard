/** Durée de validité d'une confirmation d'adresse de paiement. */
export const ADDRESS_CONFIRMATION_VALIDITY_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vrai si l'adresse a été confirmée il y a au plus 30 jours (évalué à `now`). */
export function isConfirmationFresh(confirmedAt: Date | null | undefined, now: Date = new Date()): boolean {
    if (!confirmedAt) return false;
    return now.getTime() - confirmedAt.getTime() <= ADDRESS_CONFIRMATION_VALIDITY_DAYS * DAY_MS;
}
