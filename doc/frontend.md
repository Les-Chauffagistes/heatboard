# Frontend (App Router)

Application **React 19** en App Router. La plupart des pages sont `"use client"` et
récupèrent leurs données via `src/app/api.ts` (souvent enveloppé dans un hook SWR).

## Arborescence des routes UI

| Route URL | Fichier | Description |
|-----------|---------|-------------|
| `/` | `src/app/page.tsx` | Accueil : recherche d'une adresse BTC, liens externes |
| `/login` | `src/app/login/page.tsx` | Connexion |
| `/logout` | `src/app/logout/page.tsx` | Déconnexion |
| `/board/[id]/workers` | `src/app/board/[id]/workers/page.tsx` | Table des workers d'une adresse (`ag-grid`) |
| `/board/[id]/pool` | `src/app/board/[id]/pool/page.tsx` | Vue agrégée pool (charts, camembert) |
| `/board/[id]/my` | `src/app/board/[id]/my/page.tsx` | Espace utilisateur, gestion des workers |
| `/start/[id]` | `src/app/start/[id]/page.tsx` | Onboarding : association d'un mineur (stepper) |

`[id]` dans `/board/[id]` et `/start/[id]` = **adresse Bitcoin** (récupérée via
`usePathname().split("/")[2]`).

## Layouts

- `src/app/layout.tsx` — racine `<html lang="fr">`, injecte `/config.js`
  (`window.__CONFIG__`), meta PWA (`manifest.json`, apple-touch-icon).
- `src/app/board/layout.tsx` — `metadata` OpenGraph/Twitter + `ThemeBody`.
- `src/app/board/[id]/layout.tsx` — `DesktopNavbar` + contenu + `MobileNavbar`.
- `src/app/start/[id]/layout.tsx` — layout de l'onboarding.

## Hooks (`src/app/hooks/`)

| Hook | Rôle | Détails |
|------|------|---------|
| `useSession()` | Session utilisateur | SWR sur `/api/user` + `getMe()` ; refresh 1 h ; renvoie `{ user, isLoading, isError, mutate }` ; conserve le dernier user via `useRef` |
| `useWorkerStats(addr, name, period)` | Historique d'un worker | SWR, refresh 60 s, renvoie `{ stats, isLoading, isError }` |
| `useTheme()` | Thème clair/sombre | Fournit `isDark` pour MUI `createTheme` |

## Composants notables

- `src/app/board/components/` : `DesktopNavbar`, `MobileNavbar`, `NavbarMenu`,
  `WidgetCard`, `StatsWidgetBar`.
- `src/app/board/[id]/workers/components/` : `Table` (ag-grid), `WorkerList`, `WorkerCard`,
  `WorkerPopup`, `ClaimWorkerPopup`, `HashrateLine`, `Toolbar`, `NameCell`, `HeaderInfo`.
- `src/app/board/[id]/pool/components/` : `HashrateChart`, `RepartitionPie`,
  `ResponsivePieContainer`, `CombinedWidgetCard`, `StackedStatSelector`.
- `src/app/board/[id]/my/components/` : `WorkersManager`, `WorkerHint`, `InviteFriends`.
- `src/app/start/[id]/steps/` : `S1`..`S4` (étapes de l'onboarding, empilées en cartes).
- `src/app/components/` : `Popup`, `Code`, `NoisyBackground`, `GoToCommunityPool`, `GoToBEF`.

## Données ↔ page (résumé)

- `board/workers` → `getPoolStats`, `getPoolWeight`, `getBtcPrice`, `getBtcBlockReward`.
- `board/pool` → `getPoolStats`, `getPoolHistory`, `getPoolWeight`.
- `board/my` → `useSession`, `getLinkedWorkers`, `patchUser`.
- `start` → `useSession`, `getLinkedWorkers`, `getUserToken`, `registerWorkername` +
  WebSocket (voir [`workflows.md`](./workflows.md)).

## Constantes & i18n

- `src/app/constants/columns.ts` : `HASHRATE_COLUMNS`, `COMMUNITY_POOL_ADDRESS`
  (`bc1qqp9zq4an6nyzhcspz2xfmkcf8rj0p6w94a5gyeu2a7rghxjhnqqsvymz5m`), `isValidHashrateColumn`.
- `locale/fr-FR.ts` : chaînes en français (langue par défaut de l'app).

## Utilitaires d'affichage (`src/lib/`)

`UnitConverter` (hashrate ↔ nombre), `NumberFormatter` (`Intl` fr-FR),
`TimeFormatter`, `Greeting` (Bonjour/Bonsoir), `ColorSpectrum` (HSV→hex),
`ExtractWorkername`, `Random`.
