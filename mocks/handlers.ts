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
    return FAKE_WORKER_NAMES.map((name, i) => {
        const offline = i === FAKE_WORKER_NAMES.length - 1;
        return {
            workername: `${address}.${name}`,
            lastshare: `${Math.floor(Date.now() / 1000) - (offline ? 3600 : 30)}`,
            shares: 1_000_000 + i * 123_456,
            bestshare: 50_000 + i * 1000,
            bestever: 75_000 + i * 1500,
            hashrate1m: offline ? "0" : `${(80 + i * 10).toFixed(1)}TH/s`,
            hashrate5m: offline ? "0" : `${(78 + i * 10).toFixed(1)}TH/s`,
            hashrate1hr: offline ? "0" : `${(76 + i * 10).toFixed(1)}TH/s`,
            hashrate1d: offline ? "0" : `${(74 + i * 10).toFixed(1)}TH/s`,
            hashrate7d: offline ? "0" : `${(72 + i * 10).toFixed(1)}TH/s`,
        };
    });
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
                hashrate1m: `${onlineWorkers.length * 85}TH/s`,
                hashrate5m: `${onlineWorkers.length * 83}TH/s`,
                hashrate1hr: `${onlineWorkers.length * 81}TH/s`,
                hashrate1d: `${onlineWorkers.length * 79}TH/s`,
                hashrate7d: `${onlineWorkers.length * 77}TH/s`,
                shares: 12_345_678,
                bestshare: 987_654,
                bestever: 1_234_567,
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
            const base = 400 + Math.sin(i / 4) * 50 + Math.random() * 20;
            return {
                timestamp: new Date(t).toISOString(),
                avg_hashrate1h: Number((base).toFixed(2)),
                avg_hashrate1d: Number((base - 10).toFixed(2)),
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
