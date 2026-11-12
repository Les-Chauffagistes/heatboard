import { bech32, bech32m, createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";

const base58check = createBase58check(sha256);

/** Préfixes de version mainnet : 0x00 = P2PKH ("1…"), 0x05 = P2SH ("3…"). */
const MAINNET_BASE58_VERSIONS = new Set([0x00, 0x05]);

function isValidBech32(address: string): boolean {
    if (address !== address.toLowerCase() && address !== address.toUpperCase()) return false;
    const lower = address.toLowerCase();
    if (!lower.startsWith("bc1")) return false;

    const witnessVersion = lower.charAt(3) === "q" ? 0 : null;
    try {
        if (witnessVersion === 0) {
            const { prefix, words } = bech32.decode(lower as `${string}1${string}`, 90);
            if (prefix !== "bc" || words[0] !== 0) return false;
            const program = bech32.fromWords(words.slice(1));
            return program.length === 20 || program.length === 32;
        }
        const { prefix, words } = bech32m.decode(lower as `${string}1${string}`, 90);
        if (prefix !== "bc" || words[0] < 1 || words[0] > 16) return false;
        const program = bech32m.fromWords(words.slice(1));
        return program.length >= 2 && program.length <= 40;
    } catch {
        return false;
    }
}

function isValidBase58(address: string): boolean {
    try {
        const payload = base58check.decode(address);
        return payload.length === 21 && MAINNET_BASE58_VERSIONS.has(payload[0]);
    } catch {
        return false;
    }
}

/** Valide une adresse Bitcoin **mainnet** (P2PKH, P2SH, bech32 v0, bech32m v1+). */
export function isValidBtcAddress(address: string): boolean {
    if (!address || address !== address.trim()) return false;
    return address.startsWith("1") || address.startsWith("3")
        ? isValidBase58(address)
        : isValidBech32(address);
}
