# Configuration

## Deux mécanismes de configuration

### 1. `src/lib/config.ts` — config **isomorphe** (client + serveur)
Objet avec getters qui, **au runtime**, lisent :
- côté navigateur : `window.__CONFIG__.<KEY>` (injecté par `/config.js`),
- côté serveur : `process.env.<KEY>`.

Clés : `BASE_URL`, `API_URL`, `HISTORY_API_URL`, `BITCOIN_API_URL`, `AUTH_URL`,
`AUTH_API_URL`. À utiliser dans le code **partagé** (client) — ex. `src/app/api.ts`,
`src/lib/auth.ts`, pages client.

### 2. `src/server/env.ts` — config **serveur strict**
Getters `env.apiUrl / historyApiUrl / bitcoinApiUrl / baseUrl` qui **jettent** si la
variable est absente et suppriment le `/` final. À utiliser dans les **routes API**
serveur (ex. `route:exists`).

### Injection runtime côté client
`docker-entrypoint.sh` génère `public/config.js` à partir des variables d'environnement :
```js
window.__CONFIG__ = { BASE_URL, API_URL, HISTORY_API_URL, BITCOIN_API_URL, AUTH_URL, AUTH_API_URL };
```
`src/app/layout.tsx` charge `<script src="/config.js">` avant l'hydratation.
Le type de `window.__CONFIG__` est déclaré dans `src/types/global.d.ts`.

> **Ajouter une nouvelle URL de config** = modifier **4 endroits** :
> `src/lib/config.ts`, `src/types/global.d.ts`, `docker-entrypoint.sh` (bloc `config.js`),
> et `.env.template`. Si elle sert côté serveur strict, l'ajouter aussi à `src/server/env.ts`.

---

## Variables d'environnement (`.env.template`)

### API externes
| Variable | Exemple / défaut | Usage |
|----------|------------------|-------|
| `API_URL` | `https://chauffagistes-pool.fr:3000` | Pool API |
| `HISTORY_API_URL` | `http://localhost:8080` | Serveur d'historique |
| `BITCOIN_API_URL` | `https://bitcoin.chauffagistes-pool.fr` | Prix/reward BTC |
| `AUTH_URL` / `AUTH_API_URL` | — | Auth (UI / API) |
| `BASE_URL` | `https://stats.chauffagistes-pool.fr` | URL publique du site |
| `POOL_TOKEN` | — | Bearer attendu du webhook pool |
| `NEXT_PUBLIC_MOCK_API` | `1` | Active MSW (`npm run dev:mock`) |

### PostgreSQL
`PGHOST`, `PGPORT` (5432), `PGUSER`, `PGPASSWORD`, `PGDATABASE`, et `DATABASE_URL`
(chaîne Prisma, ex. `postgresql://postgres:...@localhost:5432/chauffagistes`).

### Authentification / secrets
| Variable | Rôle |
|----------|------|
| `SESSION_PASSWORD` | Clé (hex 64) → dérive la clé AES-GCM des tokens WS (`src/server/websockets.ts`) |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | OAuth2 Discord |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Chiffrement cookies / URL |

### En production (Docker secrets)
`docker-entrypoint.sh` lit certains secrets depuis `/run/secrets/*` puis exporte les
env correspondantes : `heatboard_staging_db_password`, `heatboard_staging_pool_token`,
`heatboard_staging_session_password`, `heatboard_staging_discord_client_secret`,
`heatboard_staging_nextauth_secret`. `DATABASE_URL` est reconstruite à partir de
`PGHOST/PGPORT/PGDATABASE` + le mot de passe secret.

---

## Scripts npm (`package.json`)
| Script | Commande | But |
|--------|----------|-----|
| `dev` | `next dev --turbopack -p 3002` | Dev local (port 3002) |
| `dev:mock` | `NEXT_PUBLIC_MOCK_API=1 next dev ...` | Dev avec API externes mockées (MSW) |
| `build` | `next build --turbopack` | Build de production (`output: standalone`) |
| `start` | `next start -p 3002` | Serveur de prod |
| `lint` | `eslint` | Lint |
| `prepare` | `next-ws patch` | Patch next-ws (support WebSocket) |
