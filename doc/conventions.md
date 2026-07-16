# Conventions du repo

Conventions observées dans le code. À respecter pour rester cohérent.

## Langue
- **Français** partout : commentaires, textes UI, messages de log, `locale/fr-FR.ts`,
  `<html lang="fr">`. Écris les commentaires et le contenu utilisateur en français.

## Structure & imports
- Alias `@/` → `src/` (voir `tsconfig.json`). Les `models/` (à la racine) sont importés
  soit via chemins relatifs, soit via `@/../models/...`.
- **Client Prisma unique** : toujours `import { prisma } from "@/server/Prisma"`. Ne pas
  instancier de nouveau `PrismaClient`. Le client généré est dans `generated/prisma/`
  (committé, régénéré par `prisma generate`).
- Accès BDD via **Prisma**, pas via le `pg` brut de `src/server/Postrgre.ts` (legacy).

## Routes API (App Router)
- Un fichier `route.ts` par endpoint, exportant les verbes (`GET`, `POST`, `PATCH`, `UPGRADE`).
- `params` est une **Promise** : `{ params }: { params: Promise<{ address: string }> }`
  puis `const p = await params;` (convention Next 15).
- Réponses via `NextResponse.json(payload, { status })`.
- Auth serveur : `const user = await getMe(await getServerCookieHeader());` puis
  `if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });`.
- Proxy externe : `AbortController` + timeout 8 s, `cache: "no-store"`, `502` sur échec amont.
- Validation d'entrée avec **Zod** (`z.object(...).parse(...)`) pour les payloads externes
  (ex. webhook).

## Config
- Code partagé/client → `config` (`src/lib/config.ts`, isomorphe).
- Routes serveur strictes → `env` (`src/server/env.ts`, throw si absent).
- Voir la règle des « 4 endroits » pour ajouter une URL dans [`configuration.md`](./configuration.md).

## Frontend
- Pages interactives en **`"use client"`**.
- Récupération de données : **SWR** (via `src/app/api.ts`), souvent encapsulée dans un hook
  `src/app/hooks/*`. Options courantes : `revalidateOnFocus: false`, `refreshInterval`.
- L'adresse BTC est extraite de l'URL : `usePathname().split("/")[2]`.
- Styling : mélange de **CSS** (fichiers `*.css` co-localisés) et **styles inline**, avec
  **variables CSS** (`var(--background)`, `var(--orange)`, `var(--card-outline-color)`…).
  Charts via `@mui/x-charts`, tables via `ag-grid-react`.

## Nommage
- Composants React : `PascalCase.tsx`. Fichiers CSS co-localisés : `camelCase.css`.
- Utilitaires `src/lib/` : classes statiques (`UnitConverter`, `ExtractWorkername`,
  `ColorSpectrum`, `TimeFormatter`) ou fonctions par défaut (`formatNumber`, `randint`, `greeting`).
- Modèles/types : `models/**` en `PascalCase` ; sous-dossier `models/API Payloads/` pour les
  formes renvoyées par les API externes.

## Sécurité
- Le webhook pool est authentifié par `Authorization: Bearer {POOL_TOKEN}`.
- Tokens WebSocket chiffrés **AES-256-GCM** (clé dérivée de `SESSION_PASSWORD`).
- Ne jamais committer de secret ; les secrets de prod viennent de `/run/secrets/*`.

## Lint / build
- Lint : `npm run lint` (ESLint 9 + `eslint-config-next`, config `eslint.config.mjs`).
- Build : `npm run build` (Turbopack, `output: standalone`).
- TypeScript strict ; le build type-check (nécessite `SESSION_PASSWORD` défini, cf. dockerfile).
