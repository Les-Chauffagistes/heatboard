import { describe, expect, it } from "vitest";
import { amountForPart } from "../amounts";

const REWARD = 312_500_000n; // 3,125 BTC

describe("amountForPart", () => {
    it("calcule la part exacte", () => {
        expect(amountForPart(REWARD, 0.5)).toBe(156_250_000n);
        expect(amountForPart(REWARD, "0.1")).toBe(31_250_000n);
    });

    it("tronque à l'unité inférieure", () => {
        expect(amountForPart(REWARD, 1 / 3)).toBe(104_166_666n);
    });

    it("ne dérive pas avec les flottants", () => {
        expect(amountForPart(100n, 0.07)).toBe(7n); // 0.07 * 100 = 7.000000000000001 en flottant
        expect(amountForPart(100n, 0.29)).toBe(29n); // 0.29 * 100 = 28.999999999999996 en flottant
    });

    it("gère 0 et 1", () => {
        expect(amountForPart(REWARD, 0)).toBe(0n);
        expect(amountForPart(REWARD, 1)).toBe(REWARD);
    });

    it("la somme des montants ne dépasse jamais la récompense", () => {
        const parts = [0.123456789, 0.333333333, 0.2, 0.343209878];
        const total = parts.reduce((sum, p) => sum + amountForPart(REWARD, p), 0n);
        expect(total <= REWARD).toBe(true);
    });
});
