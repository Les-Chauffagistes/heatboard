import { describe, expect, it } from "vitest";
import { bech32 } from "@scure/base";
import { isValidBtcAddress } from "../btcAddress";
import { COMMUNITY_POOL_ADDRESS } from "@/app/constants/columns";

describe("isValidBtcAddress", () => {
    it.each([
        ["P2PKH", "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"],
        ["P2SH", "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"],
        ["bech32 P2WPKH", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"],
        ["bech32 P2WSH (adresse de la pool)", COMMUNITY_POOL_ADDRESS],
        ["bech32m taproot", "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0"],
        ["majuscules", "BC1QAR0SRRR7XFKVY5L643LYDNW9RE59GTZZWF5MDQ"],
    ])("accepte %s", (_label, address) => {
        expect(isValidBtcAddress(address)).toBe(true);
    });

    it.each([
        ["vide", ""],
        ["espaces autour", " 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"],
        ["checksum base58 invalide", "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3"],
        ["checksum bech32 invalide", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdp"],
        ["testnet bech32", "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"],
        ["testnet base58", "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn"],
        ["casse mélangée", "bc1qAr0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"],
        ["texte quelconque", "pas une adresse"],
    ])("refuse %s", (_label, address) => {
        expect(isValidBtcAddress(address)).toBe(false);
    });

    it("refuse un programme v1 encodé en bech32 au lieu de bech32m", () => {
        const program = new Uint8Array(32).fill(7);
        const address = bech32.encode("bc", [1, ...bech32.toWords(program)]);
        expect(isValidBtcAddress(address)).toBe(false);
    });
});
