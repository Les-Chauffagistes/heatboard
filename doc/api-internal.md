# API interne (routes Next.js / BFF)

Toutes les routes vivent sous `src/app/api/**/route.ts` (App Router). Elles sont
appelées en **même origine** depuis le navigateur (pas de CORS), contrairement aux
API externes. Le client typé correspondant est `src/app/api.ts`.

Conventions communes :
- Auth serveur via `getMe(await getServerCookieHeader())` (`src/lib/auth.ts` +
  `src/lib/auth.server.ts`). Retour `401` si non authentifié.
- Réponses via `NextResponse.json(...)`.
- Les proxys vers l'extérieur utilisent un `AbortController` (timeout 8 s) et
  renvoient `502` en cas d'échec amont.

---

## `GET /api/[address]/exists`
Fichier : `src/app/api/[address]/exists/route.ts`
- Proxy vers `GET {API_URL}/api/stats/{address}` (Pool API), `cache: no-store`.
- `200` amont → `{ exists: true }` ; `404` amont → `{ exists: false }` ; sinon `502`.
- Client : `addresssExists(address)`.

## `GET /api/[address]/workernames`
Fichier : `src/app/api/[address]/workernames/route.ts`
- **Auth requise.** Renvoie les associations `status ∈ {done, pending}` de
  `(btc_address = address, user = me.user_id)` depuis la table `workernames`.
- Sérialisation via `src/app/api/lib/serialize.ts`.
- Client : `getLinkedWorkers(address)`.

## `GET /api/[address]/workernames/[workername]`
Fichier : `src/app/api/[address]/workernames/[workername]/route.ts`
- **Public.** `count` des lignes `status ∈ {done, pending}` pour ce workername/adresse.
- `{ exists: true|false }`. Client : `workernameAvailable(address, workername)` (négation).

## `POST /api/[address]/workernames/[workername]`
Même fichier que ci-dessus.
- **Auth requise.** Crée une réservation `pending` avec un `code` aléatoire (6 chiffres).
- Refus (`400`) si : workername déjà `done` (`Already exists`) / l'utilisateur a déjà un
  `done` (`Max limit`) / l'utilisateur a déjà un `pending` (`Pending`).
- Succès → `{ type: 'new', code }`. Client : `registerWorkername(address, workername)`.

## `GET /api/[address]/workernames/[workername]/ws`
Fichier : `src/app/api/[address]/workernames/[workername]/ws/route.ts`
- `GET` classique renvoie `NextResponse.next()`.
- Handler **`UPGRADE`** (via `next-ws`) : lit `?token=`, `decrypt` → `user.id`, enregistre
  la socket dans `websockets` (`Map<userId, WebSocket>`). Répond `pong` sur `{type:"ping"}`.
- Sert à recevoir l'événement `{ ready: true }` en fin d'association.

## `GET /api/user`
Fichier : `src/app/api/user/route.ts`
- **Auth requise.** `upsert` de `user` (`id = me.user_id`) puis renvoie `{ id, address }`.
- Client : consommé par `useSession` (`src/app/hooks/useSession.ts`).

## `PATCH /api/user`
Auth requise. Corps `{ address }` uniquement (tout autre champ est rejeté ou ignoré). Enregistre l'adresse de
paiement, la **confirme** (`confirmedAt` posé côté serveur) et la fige sur les paiements en attente. 422 si
l'adresse Bitcoin mainnet est invalide.

## `GET /api/user/token`
Fichier : `src/app/api/user/token/route.ts`
- **Auth requise.** Renvoie `{ token }` = `encrypt(user.user_id)` (AES-GCM), à passer au WS.
- Client : `getUserToken()`.

## `POST /api/webhooks/link-workername`
Fichier : `src/app/api/webhooks/link-workername/route.ts`
- **Appelé par la Pool** (pas le navigateur). Auth par header
  `Authorization: Bearer {POOL_TOKEN}`.
- Body validé par **Zod** : `{ user, worker, code, lastSeen }`.
- Effets : passe l'association correspondante à `status = "done"`, **supprime** les autres
  réservations concurrentes du même `(btc_address, workername)`, puis notifie l'utilisateur
  via WebSocket (`{ ready: true }`) si connecté.
- Erreurs : `400` (JSON/Zod invalide), réponse `Auth failed` si le bearer ne correspond pas.

---

## Paiements des récompenses de block (pool communautaire)

Logique métier dans `src/server/payout/` (`BlockPayoutService`), câblée par `getPayoutService()`.
Un block est enregistré avec la répartition du travail à sa date de minage (history-server
`GET /v1/{address}/distribution?at=`) et sa subsidy (bitcoin-service, hors frais). Une ligne `payment` par
workername ; les workernames non liés (`workernames.status = "done"`) ou revendiqués par plusieurs comptes
n'ont pas de `user` et ne sont jamais payés.

### Membre (session requise)
- `GET /api/payouts` → `{ requiredAction: "address_missing" | "address_confirmation_required" | null, payments }`
  (paiements du membre uniquement, avec leur audit log `updates`).
- `POST /api/payouts/address` → corps `{ address? }` : enregistre/reconfirme l'adresse (changer = confirmer) et la
  fige sur tous ses paiements `waiting` (→ `pending`). Une adresse confirmée il y a ≤ 30 jours est figée d'office
  à l'enregistrement du block.

### Admin (`Authorization: Bearer <ADMIN_API_KEY>`, sinon 401)
- `POST /api/admin/blocks` → `{ height, minedAt (ISO 8601 avec fuseau), rewardSatoshi? }`, en-tête optionnel
  `Idempotency-Key` (uuid). 201 créé, 200 rejeu de la même clé, 409 hauteur déjà enregistrée, 502 si
  history-server/bitcoin-service est indisponible (rien n'est enregistré).
- `GET /api/admin/blocks`, `GET /api/admin/blocks/[height]` (avec paiements).
- `DELETE /api/admin/blocks/[height]` → 204, ou 409 si le block a des paiements (pas de cascade).
- `GET /api/admin/payments?block=&status=&user=`, `GET /api/admin/payments/[id]` (avec audit log).
- `PATCH /api/admin/payments/[id]` → `{ status: waiting|pending|sent|cancelled, note?, txid? }`. Toute transition est
  permise (retours en arrière inclus) et journalisée ; `sent` exige une adresse figée.

### Tests
`npm test` (unitaires), `npm run test:integration` (testcontainers, Docker requis), `npm run test:e2e`
(Playwright ; Postgres jetable, history-server/bitcoin-service/auth mockés par `tests/e2e/stack.mjs`).

## Ajouter une route (checklist agent)
1. Créer `src/app/api/<chemin>/route.ts` exportant `GET/POST/...`.
2. Auth : `getMe(await getServerCookieHeader())` si protégé.
3. BDD : `import { prisma } from "@/server/Prisma"`.
4. Ajouter la fonction cliente correspondante dans `src/app/api.ts`.
5. Si l'endpoint appelle une API externe **et** doit être mocké en local, ajouter un
   handler dans `mocks/handlers.ts` (voir [`api-external.md`](./api-external.md)).
