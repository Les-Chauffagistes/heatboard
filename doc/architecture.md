# Architecture

## Vue d'ensemble

Heatboard est une application **Next.js 15 (App Router)** jouant le rôle de
**Backend-For-Frontend (BFF)** : la majeure partie des données de minage provient
d'API externes, et le serveur Next.js n'ajoute une couche que là où c'est
nécessaire (authentification, base de données des associations, temps réel).

```
Navigateur (React 19, CSR)
   │  ├─ fetch direct → API externes (pool, historique, bitcoin)   [via config.*_URL]
   │  └─ fetch → /api/* (routes Next.js)                            [même origine]
   ▼
Serveur Next.js (Node, port 3002)
   ├─ Routes /api/* .................. BFF (proxy, BDD, tokens, WS)
   ├─ Prisma (adapter pg) ............ PostgreSQL: user, workernames
   ├─ WebSocket (next-ws) ............ notifications temps réel
   └─ Auth client → Auth API externe (cookies)
```

## Frontières et responsabilités

| Couche | Fichiers | Responsabilité | Ne fait PAS |
|--------|----------|----------------|-------------|
| **UI / Pages** | `src/app/**/page.tsx` | Rendu, interactions, appels via `api.ts`/hooks | Accès direct BDD |
| **Hooks** | `src/app/hooks/*` | Récupération et cache de données (SWR) | Logique de rendu |
| **Client API** | `src/app/api.ts`, `src/lib/auth.ts` | `fetch` typés vers externe + interne | État global |
| **Routes API** | `src/app/api/**/route.ts` | BFF : proxy, BDD, auth serveur, WS handshake | Rendu |
| **Serveur** | `src/server/*` | Client Prisma, registre WS, lecture env | Accès depuis le client |
| **Lib** | `src/lib/*` | Utilitaires purs (conversion, formatage, config) | Effets de bord réseau (sauf `auth.ts`) |
| **Modèles** | `models/**` | Types des payloads API et du domaine | Runtime |

## Rendu SSR vs CSR

- La plupart des pages sont **`"use client"`** (voir `page.tsx` : `board/*`, `start`,
  `home`). Le rendu et la récupération de données se font côté navigateur.
- Le layout racine `src/app/layout.tsx` injecte `<script src="/config.js">` **avant**
  l'hydratation → `window.__CONFIG__` est disponible pour `config` côté client.
- `src/app/board/layout.tsx` définit les `metadata` (OpenGraph/Twitter) côté serveur
  à partir de `process.env.BASE_URL`.

## Composants transverses

- **Thème** : `useTheme` + `ThemeBody` + variables CSS (`var(--background)`, `var(--orange)`…).
- **Navigation** : `DesktopNavbar` (>= 800px) / `MobileNavbar` (< 800px) dans
  `src/app/board/components/`.
- **Fond animé** : `NoisyBackground` (simplex-noise) utilisé sur l'onboarding.
- **Graphiques** : `@mui/x-charts` (hashrate, camembert de répartition) ; `ag-grid-react`
  pour la table des workers.

## Modules serveur clés

- `src/server/Prisma.ts` — instancie `PrismaClient` avec `PrismaPg` (adapter `pg`) sur
  `DATABASE_URL`. **Client Prisma unique** à réutiliser (`import { prisma }`).
- `src/server/Postrgre.ts` — un `Pool` `pg` brut basé sur `PGHOST/PGPORT/...`.
  ⚠️ Semble legacy/inutilisé par les routes actuelles (qui passent par Prisma) — vérifier
  avant de s'appuyer dessus.
- `src/server/websockets.ts` — `Map<userId, WebSocket>` en mémoire + `encrypt/decrypt`
  AES-256-GCM (clé = SHA-256 de `SESSION_PASSWORD`).
- `src/server/env.ts` — accès **strict** (throw si absent) aux env serveur, avec
  suppression du `/` final.

## Voir aussi

- Détail des données → [`data-model.md`](./data-model.md)
- Détail des routes → [`api-internal.md`](./api-internal.md)
- Parcours métier (auth, association) → [`workflows.md`](./workflows.md)
