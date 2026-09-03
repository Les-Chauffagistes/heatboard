# Heatboard — Dashboard Les Chauffagistes

Dashboard public officiel de la plateforme de minage Bitcoin **Les Chauffagistes**. Il agrège
et affiche les statistiques de minage (hashrate, workers, historique, prix du BTC) des pools hébergées.

Application **Next.js 15** (App Router, React 19, TypeScript) jouant le rôle de
Backend-For-Frontend au-dessus d'API externes et d'une base **PostgreSQL** (via Prisma).

## Services dont dépend le dashboard

| Service                                                                                                                                                        | Rôle                          | Variable                                                |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------|---------------------------------------------------------|
| [API publique de la pool](https://github.com/Les-Chauffagistes/chauffagistes-pool-api)                                                                         | Statistiques instantanées     | `API_URL` (défaut `https://chauffagistes-pool.fr:3000`) |
| [Serveur d'historique](https://github.com/Les-Chauffagistes/history-server)                                                                                    | Séries temporelles            | `HISTORY_API_URL`                                       |
| [API Bitcoin](https://github.com/Les-Chauffagistes/bitcoin-service)                                                                                            | Prix & récompense de bloc     | `BITCOIN_API_URL`                                       |
| Service d'authentification ([Back](https://github.com/Les-Chauffagistes/auth-service-back) & [Front](https://github.com/Les-Chauffagistes/auth-service-front)) | Session utilisateur (cookies) | `AUTH_API_URL` / `AUTH_URL`                             |

> En l'état, vous ne pouvez pas héberger une instance pleinement fonctionnelle : le
> dashboard s'appuie sur une base peuplée par le serveur d'historique, qui exploite une
> API privée. Le code reste ouvert et vous pouvez le lancer avec des données de test ou
> les API externes mockées (voir plus bas).

## Prérequis

- Node.js 22
- PostgreSQL (local ou via Docker)

## Démarrage rapide

```shell
# 1. Installer les dépendances
npm i

# 2. Démarrer une base PostgreSQL (exemple via Docker Compose)
docker compose up -d db

# 3. Configurer l'environnement
cp .env.template .env   # puis renseigner les valeurs

# 4. Initialiser la base
npx prisma migrate deploy
npx prisma generate
# (optionnel) peupler avec des données de test : fixture.sql

# 5. Lancer le serveur de développement (port 3002)
npm run dev
```

Le dashboard est alors disponible sur http://localhost:3002.

## Développement avec API externes mockées (MSW)

Les environnements de production n'autorisent pas
`http://localhost:3002` dans leur CORS, ce qui empêche `next dev` de récupérer leurs
données. Pour tester l'UI en local sans dépendre de ces API, on mocke les 4 API externes
(pool, historique, bitcoin, auth) avec [Mock Service Worker](https://mswjs.io/) :

```shell
npm run dev:mock
```

Les handlers sont définis dans `mocks/handlers.ts`. Pour mocker un nouvel appel externe,
ajoutez-y un handler `http.get/post/delete("*/mon/chemin", ...)` (le matching se fait sur
le suffixe du chemin, car les URLs de base sont configurées dynamiquement). Les routes
internes `/api/*` (même origine, pas de CORS) ne sont pas concernées.

## Scripts

| Commande           | Description                                     |
|--------------------|-------------------------------------------------|
| `npm run dev`      | Serveur de développement (Turbopack, port 3002) |
| `npm run dev:mock` | Idem avec les API externes mockées (MSW)        |
| `npm run build`    | Build de production (`output: standalone`)      |
| `npm run start`    | Serveur de production (port 3002)               |
| `npm run lint`     | ESLint                                          |

## Configuration

Toutes les variables d'environnement sont documentées dans `.env.template` (API externes,
PostgreSQL, secrets d'authentification). Les URLs sont injectées au runtime côté client via
`public/config.js` (`window.__CONFIG__`). Voir [`doc/configuration.md`](./doc/configuration.md)
pour le détail.

## Structure du projet

```
src/
  app/            Pages (App Router), routes API /api/*, hooks, composants
  lib/            Utilitaires (config, auth, conversions, formatage)
  server/         Client Prisma, registre WebSocket, lecture env
  types/          Types globaux
models/           Types des payloads API et du domaine
prisma/           Schéma et migrations PostgreSQL
generated/        Client Prisma généré (committé)
mocks/            Handlers MSW pour le mode dev:mock
locale/           Chaînes de traduction (fr-FR)
doc/              Documentation détaillée (graphe de connaissance)
```

## Documentation

Une documentation détaillée, structurée en graphe de connaissance, est disponible dans
[`doc/`](./doc/README.md) : architecture, modèle de données, API interne/externe, parcours
métier (association d'un mineur), configuration, déploiement et conventions.

## Déploiement

Image Docker multi-stage (`dockerfile`) : `build`, `runner` (build standalone Next.js,
applique les migrations Prisma au démarrage avant de lancer le serveur). Le CI/CD est
décrit dans `.github/workflows/`. Détails : [`doc/deployment.md`](./doc/deployment.md).
