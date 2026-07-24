# Modèle de données

Deux sources de types coexistent :
1. **Schéma Prisma** (`prisma/schema.prisma`) → tables PostgreSQL persistées par ce service.
2. **Modèles de payloads** (`models/**`) → formes des données renvoyées par les API externes
   et types de domaine côté UI (non persistés ici).

---

## 1. Schéma Prisma (PostgreSQL)

Fichier : `prisma/schema.prisma`. Client généré dans `generated/prisma/`
(⚠️ committé dans le repo, régénéré via `npx prisma generate`).

### Table `user`
```prisma
model user {
  id      String   // = user_id du service d'auth externe
  address String?  // adresse BTC choisie par l'utilisateur (nullable)
  @@id(id)
}
```
- `id` = identifiant provenant de l'**Auth API** (`getMe().user_id`).
- Créée par **upsert** au premier `GET /api/user` (`src/app/api/user/route.ts`).
- `address` mise à jour via `PATCH /api/user`.

### Table `workernames` (association mineur ↔ utilisateur)
```prisma
model workernames {
  workername  String
  user        String   // = user.id
  status      String   @default("pending")  // "pending" | "done"
  created_at  DateTime @default(now()) @db.Date
  btc_address String
  code        String   // code d'association à 6 chiffres
  @@id([workername, user, btc_address])   // clé primaire composite
}
```
- **Clé primaire composite** : `(workername, user, btc_address)`.
- `status` : `pending` (réservé, code généré, pas encore validé par la pool) →
  `done` (association confirmée par le webhook pool).
- `code` : entier `111111`–`999999` (`src/lib/Random.ts`), utilisé par le mineur pour
  prouver la possession lors de la validation.
- Pas de relation Prisma déclarée vers `user` (lien logique uniquement).

### Migrations
- `prisma/migrations/0_init/` — schéma initial
- `20260224122813_add_password_users/`
- `20260629142854_remove_old_accs/`

---

## 2. Modèles de payloads externes (`models/`)

### Statistiques instantanées — `models/API Payloads/Stats.ts`
```ts
UserInstantStats {
  address: string
  globalStats: Hashrates & { shares, bestshare, bestever, workers }
  workers: Worker[]
}
```
Renvoyé par `GET {API_URL}/api/stats/{address}` (Pool API).

### Worker — `models/Worker.ts` (+ `models/Hashrates.ts`)
```ts
Worker extends Hashrates {
  workername, lastshare, shares, bestshare, bestever
}
// Hashrates: hashrate1m, hashrate5m, hashrate1hr, hashrate1d, hashrate7d (strings ex "80.0TH/s")
```

### Historiques — `models/API Payloads/*`
- `WorkerHistoryRecord` : `timestamp` + `avg_hashrate{1m,5m,1h,1d,7d}` + `avg_weight` (strings).
- `PoolHistoryRecord` : `timestamp`, `avg_hashrate1h`, `avg_hashrate1d` (numbers).
- `Weights` : poids par worker.
- Période historique : `"daily"` (`30d`, 1 point / 30 min) ou `"forever"` (1 point / jour).
  ⚠️ `getWorkerStatsHistory` type le paramètre `"daily" | "forever"` mais construit l'URL
  `/{period}` — l'API historique attend `daily`/`forever` (voir `src/app/api.ts`).

### Bitcoin — `models/API Payloads/BitcoinPrice.ts`
`{ time, USD, EUR, GBP, CAD, CHF, AUD, JPY }` + `getBtcBlockReward()` → `number`.

### Association — `models/API Payloads/`
- `LinkedWorkers` : `{ btc_address, user, workername, status: "done"|"pending", created_at, code? }`
- `WorkerLinkCode` : `{ code: number, type: "pending"|"done" }`

### Types de domaine UI additionnels (`models/`)
`Pool`, `PoolHashrate`, `PoolRuntime`, `PoolShares`, `Repartition`, `BestRecord`,
`Node`, `NumberHashrates`, `CleanWorkerHashrate`, `User`. Utilisés pour typer l'affichage.

---

## Conversion des unités

Les hashrates externes sont des **chaînes** avec suffixe (`"80.0TH/s"`).
`src/lib/UnitConverter.ts` convertit chaîne↔nombre (`K/M/G/T/P/E` = 1e3…1e18).
`ExtractWorkername.fromPool("addr.rig-01")` → `"rig-01"` (`src/lib/ExtractWorkername.ts`).

## Règles à respecter (agent)

- Toute écriture BDD passe par `prisma` (`src/server/Prisma.ts`), jamais `pg` brut.
- Modifier une table = éditer `schema.prisma` **puis** créer une migration **puis**
  `prisma generate` (le client généré est committé).
- La clé primaire composite de `workernames` implique de fournir les 3 champs pour
  cibler une ligne unique.
