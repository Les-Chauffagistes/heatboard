import { describe, expect, it } from "vitest";
import { isConfirmationFresh } from "../addressPolicy";

const NOW = new Date("2026-11-06T12:00:00.000Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);

describe("isConfirmationFresh", () => {
    it("refuse une adresse jamais confirmée", () => {
        expect(isConfirmationFresh(null, NOW)).toBe(false);
        expect(isConfirmationFresh(undefined, NOW)).toBe(false);
    });

    it("accepte jusqu'à 30 jours inclus", () => {
        expect(isConfirmationFresh(daysAgo(0), NOW)).toBe(true);
        expect(isConfirmationFresh(daysAgo(30), NOW)).toBe(true);
    });

    it("refuse au-delà de 30 jours", () => {
        expect(isConfirmationFresh(new Date(daysAgo(30).getTime() - 1), NOW)).toBe(false);
    });
});
