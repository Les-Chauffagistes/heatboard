import { http, HttpResponse } from "msw";
import type { UserInstantStats } from "../models/API Payloads/Stats";
import type { WorkerHistoryRecord } from "../models/API Payloads/WorkerHistoryRecord";
import type { PoolHistoryRecord } from "../models/API Payloads/PoolHistoryRecord";
import type { Weights } from "../models/API Payloads/Weights";
import type { BitcoinPrice } from "../models/API Payloads/BitcoinPrice";
import type { Worker } from "../models/Worker";

/**
 * Handlers MSW pour mocker les 4 API externes (API_URL, HISTORY_API_URL,
 * BITCOIN_API_URL, AUTH_API_URL) en développement local, sans dépendre du CORS
 * des environnements de staging.
 *
 * Les URLs de base sont dynamiques (config runtime), donc on matche sur le
 * suffixe du chemin ("*\/..." ) plutôt que sur une URL absolue complète.
 *
 * Pour ajouter un nouvel endpoint à mocker :
 * 1. Ajoute un handler ci-dessous avec `http.get/post/delete("*\/mon/chemin", ...)`.
 * 2. Retourne un payload réaliste avec `HttpResponse.json(...)`.
 */

const FAKE_WORKER_NAMES = ["rig-01", "rig-02", "antminer-s19", "whatsminer-m30", "s21-pro", "avalon-a1466"];

function fakeWorkers(address: string): Worker[] {
    return [
        {
            "workername": `${address}.rig-01`,
            "lastshare": `${Math.floor(Date.now() / 1000)}`,
            "hashrate1m":  "25232000000000",
            "hashrate5m":  "23562000000000",
            "hashrate1hr": "23457000000000",
            "hashrate1d":  "23322000000000",
            "hashrate7d":  "23752000000000",
            "shares": 1_300_000_000,
            "bestshare": 75_000_000,
            "bestever": 75_000_000,
        },
        {
            "workername": `${address}.rig-02`,
            "lastshare": `${Math.floor(Date.now() / 1000)}`,
            "hashrate1m":  "2332000000000",
            "hashrate5m":  "753562000000000",
            "hashrate1hr": "73457000000000",
            "hashrate1d":  "83322000000000",
            "hashrate7d":  "89752000000000",
            "shares": 8_300_000_000,
            "bestshare": 98_100_000,
            "bestever": 98_100_000,
        },
        {
            "workername": `${address}.antminer-s19`,
            "lastshare": `${Math.floor(Date.now() / 1000) - 3600}`,
            "hashrate1m":  "0",
            "hashrate5m":  "355000",
            "hashrate1hr": "51000000000000",
            "hashrate1d":  "111000000000000",
            "hashrate7d":  "111000000000000",
            "shares": 7_400_000_000,
            "bestshare": 126_100_000,
            "bestever": 126_100_000,
        },
        {
            "workername": `${address}.whatsminer-m30`,
            "lastshare": "",
            "hashrate1m":  "45000000000000",
            "hashrate5m":  "44100000000000",
            "hashrate1hr": "44100000000000",
            "hashrate1d":  "44100000000000",
            "hashrate7d":  "45100000000000",
            "shares": 7_400_000_000,
            "bestshare": 126_100_000,
            "bestever": 126_100_000,
        },
        {
            "workername": `${address}.s21-pro`,
            "lastshare": "",
            "hashrate1m":  "235000000000000",
            "hashrate5m":  "233000000000000",
            "hashrate1hr": "235000000000000",
            "hashrate1d":  "244000000000000",
            "hashrate7d":  "251000000000000",
            "shares": 355_400_000_000,
            "bestshare": 126_100_000,
            "bestever": 126_100_000,
        },
        {
            "workername": `${address}.avalon-a1466`,
            "lastshare": "",
            "hashrate1m":  "902000000000000",
            "hashrate5m":  "913000000000000",
            "hashrate1hr": "905000000000000",
            "hashrate1d":  "901000000000000",
            "hashrate7d":  "903000000000000",
            "shares": 5_230_000_000,
            "bestshare": 511_100_000,
            "bestever": 511_100_000,
        },
    ]
}

export const handlers = [
    // ===== AUTH_API_URL =====
    http.get("*/me", () => {
        return HttpResponse.json({
            user_id: "mock-user-id-1234",
            pseudo: "MockChauffagiste",
        });
    }),

    http.post("*/refresh", () => {
        return new HttpResponse(null, { status: 200 });
    }),

    http.delete("*/logout", () => {
        return new HttpResponse(null, { status: 200 });
    }),

    // ===== API_URL =====
    http.get("*/api/stats/:address", ({ params }) => {
        const address = String(params.address);
        const workers = fakeWorkers(address);
        const onlineWorkers = workers.filter((w) => w.hashrate1m !== "0");

        const payload: UserInstantStats = {
            address,
            globalStats: {
                // Valeur brute en H/s, sans suffixe — même convention que
                // `fakeWorkers()` ci-dessus (consommée via `UnitConverter.fromStringToNumber`).
                hashrate1m: `${4.85*10e13}`,
                hashrate5m: `${4.69*10e13}`,
                hashrate1hr: `${5.00*10e13}`,
                hashrate1d: `${4.87*10e13}`,
                hashrate7d: `${4.85*10e13}`,
                shares: 912_345_678,
                bestshare: 987_654_000_000,
                bestever: 987_654_000_000,
                workers: workers.length,
            },
            workers,
        };

        return HttpResponse.json(payload);
    }),

    // ===== HISTORY_API_URL =====
    http.get("*/v1/:address/worker/:workername/:period", ({ params }) => {
        const period = String(params.period);
        const points = period === "forever" ? 90 : 30;
        const now = Date.now();
        const stepMs = period === "forever" ? 24 * 3_600_000 : 30 * 60_000;

        const records: WorkerHistoryRecord[] = Array.from({ length: points }, (_, i) => {
            const t = now - (points - i) * stepMs;
            const base = 60 + Math.sin(i / 5) * 15 + Math.random() * 5;
            return {
                timestamp: new Date(t).toISOString(),
                avg_hashrate1m: `${base.toFixed(2)}TH/s`,
                avg_hashrate5m: `${(base - 1).toFixed(2)}TH/s`,
                avg_hashrate1h: `${(base - 2).toFixed(2)}TH/s`,
                avg_hashrate1d: `${(base - 3).toFixed(2)}TH/s`,
                avg_hashrate7d: `${(base - 4).toFixed(2)}TH/s`,
                avg_weight: `${(15 + Math.random() * 5).toFixed(2)}`,
            };
        });

        return HttpResponse.json(records);
    }),

    http.get("*/v1/:address/pool", () => {
        const points = 30;
        const now = Date.now();
        const dayMs = 24 * 3_600_000;

        const records: PoolHistoryRecord[] = Array.from({ length: points }, (_, i) => {
            const t = now - (points - i) * dayMs;
            const base = 485000000000000 + Math.sin(i / 4) * 10 + Math.random() * 2000000000000;
            return {
                timestamp: new Date(t).toISOString(),
                avg_hashrate1h: Number((base).toFixed(2)),
                avg_hashrate1d: Number((base - 500000000000).toFixed(2)),
            };
        });

        return HttpResponse.json(records);
    }),

    http.get("*/v1/:address/weights", () => {
        const now = new Date().toISOString();
        const rawWeights = [18.5, 22.3, 15.8, 20.1, 14.7, 8.6];
        const weights: Weights[] = FAKE_WORKER_NAMES.map((name, i) => ({
            worker_id: name,
            avg_weight: rawWeights[i].toFixed(2),
            timestamp: now,
        }));

        return HttpResponse.json(weights);
    }),

    // ===== BITCOIN_API_URL =====
    http.get("*/v1/bitcoin-price", () => {
        const payload: BitcoinPrice = {
            time: Math.floor(Date.now() / 1000),
            USD: 68_500,
            EUR: 63_200,
            GBP: 54_100,
            CAD: 93_400,
            CHF: 60_800,
            AUD: 103_500,
            JPY: 10_650_000,
        };

        return HttpResponse.json(payload);
    }),

    http.get("*/v1/bitcoin-block-reward", () => {
        return HttpResponse.json(3.125);
    }),
];
