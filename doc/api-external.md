# API externes

Le dashboard consomme **4 services externes**. Les URLs de base sont configurées au
runtime (voir [`configuration.md`](./configuration.md)) et lues via `config.*_URL`
(`src/lib/config.ts`). Le client typé est `src/app/api.ts` (+ `src/lib/auth.ts` pour l'auth).

| Service | Variable | Rôle | Appelé depuis |
|---------|----------|------|---------------|
| Pool API | `API_URL` | Stats instantanées de minage | `api.ts` (client) + `route:exists` (serveur) |
| History API | `HISTORY_API_URL` | Séries temporelles (hashrate, poids) | `api.ts` (client) |
| Bitcoin API | `BITCOIN_API_URL` | Prix BTC & récompense de bloc | `api.ts` (client) |
| Auth API | `AUTH_API_URL` / `AUTH_URL` | Session, login/logout | `src/lib/auth.ts` |

---

## 1. Pool API (`API_URL`)
Défaut : `https://chauffagistes-pool.fr:3000`.

| Endpoint | Fonction cliente | Renvoie |
|----------|------------------|---------|
| `GET /api/stats/{address}` | `getPoolStats(address)` | `UserInstantStats` |
| `GET /api/stats/{address}` | (proxy) `route:exists` | existence de l'adresse |

La Pool **appelle aussi** le webhook interne `POST /api/webhooks/link-workername`
(authentifié par `POOL_TOKEN`) pour confirmer une association — voir
[`api-internal.md`](./api-internal.md) et [`workflows.md`](./workflows.md).

## 2. History API (`HISTORY_API_URL`)
Serveur d'historique : https://github.com/Les-Chauffagistes/history-server

| Endpoint | Fonction cliente | Renvoie |
|----------|------------------|---------|
| `GET /v1/{address}/worker/{workername}/{period}` | `getWorkerStatsHistory(...)` | `WorkerHistoryRecord[]` |
| `GET /v1/{address}/pool` | `getPoolHistory(address)` | `PoolHistoryRecord[]` |
| `GET /v1/{address}/weights` | `getPoolWeight(address)` | `Weights[]` |

`period` : `daily` (30 jours, 1 pt/30 min) ou `forever` (1 pt/jour).

## 3. Bitcoin API (`BITCOIN_API_URL`)

| Endpoint | Fonction cliente | Renvoie |
|----------|------------------|---------|
| `GET /v1/bitcoin-price` | `getBtcPrice()` | `BitcoinPrice` (multi-devises) |
| `GET /v1/bitcoin-block-reward` | `getBtcBlockReward()` | `number` |

## 4. Auth API (`AUTH_API_URL` / `AUTH_URL`)
Client : `src/lib/auth.ts`. Auth par **cookies** (`credentials: "include"`).

| Endpoint | Fonction | Comportement |
|----------|----------|--------------|
| `GET /me` | `getMe(cookieHeader?)` | User courant, **refresh auto** sur `401` |
| `POST /refresh` | `refreshToken()` | Renouvelle la session |
| `DELETE /logout` | `logOut()` | Déconnexion (CORS) |

- `getMe` fonctionne côté client (navigateur envoie les cookies) **et** côté serveur
  (on passe `getServerCookieHeader()` depuis `src/lib/auth.server.ts`).
- Types issus de `@les-chauffagistes/authentication-types`.
- `AUTH_URL` (distinct de `AUTH_API_URL`) sert aux redirections UI, ex.
  `window.location.href = ${AUTH_URL}/login?redirect=...` (`src/app/start/[id]/page.tsx`).

---

## Mocking en local (MSW)

Problème : les environnements de staging n'autorisent pas `http://localhost:3002` dans
leur CORS → `next dev` ne peut pas récupérer leurs données. Solution : **Mock Service
Worker** (`msw`).

- Activation : `npm run dev:mock` (met `NEXT_PUBLIC_MOCK_API=1`).
- Handlers : `mocks/handlers.ts` ; navigateur : `mocks/browser.ts` ; worker : `public/`.
- Le matching se fait sur le **suffixe du chemin** (`http.get("*/mon/chemin", ...)`) car
  les URLs de base sont dynamiques.
- Les routes internes `/api/*` (même origine) **ne sont pas** mockées.
- Pour mocker un nouvel appel externe : ajouter un handler dans `mocks/handlers.ts` et
  renvoyer un payload réaliste conforme aux types de `models/`.

Endpoints déjà mockés : `*/me`, `*/refresh`, `*/logout`, `*/api/stats/:address`,
`*/v1/:address/worker/:workername/:period`, `*/v1/:address/pool`, `*/v1/:address/weights`,
`*/v1/bitcoin-price`, `*/v1/bitcoin-block-reward`.
