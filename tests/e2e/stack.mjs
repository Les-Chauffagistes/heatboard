// Stack e2e : Postgres jetable (testcontainers) + faux services HTTP (auth, history-server, bitcoin-service) + `next dev`.
// Lancé par Playwright (`webServer`). Écrit tests/e2e/.state.json pour que les tests retrouvent la base.
import { execFileSync, spawn } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import http from "node:http";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

const APP_PORT = 3102;
const FAKE_PORT = 4010;
const STATE = new URL("./.state.json", import.meta.url);
const FAKE = `http://localhost:${FAKE_PORT}`;

// history-server est mocké : ses données expirent au bout d'un mois et changent à la compression.
const DISTRIBUTION = [
    { workername: "asic1", part: 0.75, sampled_at: "2026-11-04T16:59:23+00:00" },
    { workername: "asic2", part: 0.25, sampled_at: "2026-11-04T16:59:23+00:00" },
];

function cors(req, res) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
}

const json = (res, body, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
};

const fake = http.createServer((req, res) => {
    cors(req, res);
    const url = new URL(req.url, FAKE);
    if (req.method === "OPTIONS") return res.writeHead(204).end();

    // Service d'authentification : la session est le cookie `e2e_user=<id>`.
    if (url.pathname === "/me") {
        const userId = /(?:^|;\s*)e2e_user=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
        return userId ? json(res, { user_id: decodeURIComponent(userId), pseudo: `Pseudo ${userId}` }) : json(res, null, 401);
    }
    if (url.pathname === "/refresh" || url.pathname === "/logout") return res.writeHead(200).end();

    // Données de la page pool, pour que le dashboard (et donc la navbar) s'affiche réellement.
    const stats = /^\/v1\/stats\/([^/]+)$/.exec(url.pathname);
    if (stats) {
        const h = `${4.85 * 10e13}TH/s`;
        return json(res, {
            address: stats[1],
            globalStats: { hashrate1m: h, hashrate5m: h, hashrate1hr: h, hashrate1d: h, hashrate7d: h, shares: 1_000_000, bestshare: 1_000_000, bestever: 1_000_000, workers: 0 },
            workers: [],
        });
    }
    if (/^\/v1\/distribution\/[^/]+$/.test(url.pathname)) {
        return json(res, DISTRIBUTION.map(({ workername, part }) => ({ workername, part, diff_sum: part * 1e6, shares_ok: 1000, shares_ko: 1 })));
    }
    if (/^\/v1\/[^/]+\/pool$/.test(url.pathname)) {
        const now = Date.now();
        return json(res, Array.from({ length: 30 }, (_, i) => ({
            timestamp: new Date(now - (30 - i) * 86_400_000).toISOString(),
            avg_hashrate1h: 485_000_000_000_000,
            avg_hashrate1d: 484_500_000_000_000,
        })));
    }

    // history-server : répartition à une date donnée
    if (/^\/v1\/[^/]+\/distribution$/.test(url.pathname)) return json(res, DISTRIBUTION);

    // bitcoin-service : subsidy après le halving de 2024
    if (url.pathname === "/v1/bitcoin-block-reward") return json(res, 3.125);

    json(res, { error: "not mocked in e2e" }, 404);
});
await new Promise((resolve) => fake.listen(FAKE_PORT, resolve));

const container = await new PostgreSqlContainer("postgres:16-alpine").start();
const databaseUrl = container.getConnectionUri();
execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "inherit" });
writeFileSync(STATE, JSON.stringify({ databaseUrl, appUrl: `http://localhost:${APP_PORT}`, fakeUrl: FAKE, adminKey: "e2e-admin-key" }));

const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--turbopack", "-p", String(APP_PORT)], {
    stdio: "inherit",
    env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        ADMIN_API_KEY: "e2e-admin-key",
        BASE_URL: `http://localhost:${APP_PORT}`,
        API_URL: FAKE,
        HISTORY_API_URL: FAKE,
        BITCOIN_API_URL: FAKE,
        AUTH_API_URL: FAKE,
        AUTH_URL: FAKE,
        SESSION_PASSWORD: "e2e-session-password-e2e-session-password",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_DIST_DIR: ".next-e2e",
    },
});

let stopping = false;
async function stop() {
    if (stopping) return;
    stopping = true;
    app.kill("SIGTERM");
    fake.close();
    rmSync(STATE, { force: true });
    await container.stop().catch(() => {});
    process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
app.on("exit", stop);
