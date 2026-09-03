# Déploiement & build

## Image Docker (`dockerfile`) — multi-stage

Deux cibles construites depuis `node:22-alpine` :

1. **`build`** — installe les deps (`npm ci` avec secret `npmrc`), `prisma generate`,
   `npm run build`. Env factices pour le build : `DATABASE_URL="dummy"` (prisma generate),
   `SESSION_PASSWORD="dummy"` (type-checking).
2. **`runner`** — image finale. Copie le build **standalone** Next.js
   (`.next/standalone`, `.next/static`, `public`, `generated`, `prisma`), **et le
   `node_modules` complet du stage `build`** (nécessaire pour exécuter `npx prisma
   migrate deploy` au démarrage — le standalone Next.js ne trace que les deps runtime,
   pas le CLI Prisma). Installe `openssl`/`libssl3`/`curl`, expose `3002`,
   `ENTRYPOINT ["sh", "docker-entrypoint.sh"]`.

`next.config.ts` : `output: "standalone"` (nécessaire pour l'image runner).

Les migrations Prisma sont appliquées par l'app elle-même au démarrage, pas par un
conteneur séparé (ancien pattern `migrator` + volume de coordination `/migrations`,
abandonné car il forçait `app` et `migrator` à rester sur le même nœud Swarm sans
apporter de bénéfice réel — le stage `migrator` embarquait de toute façon la quasi
totalité de l'app pour exécuter une seule commande).

## Séquence de démarrage (`docker-entrypoint.sh`)
1. Lit les secrets `/run/secrets/*` → exporte `PGPASSWORD`, `DATABASE_URL`, `POOL_TOKEN`,
   `SESSION_PASSWORD`, `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`.
2. Génère `public/config.js` (`window.__CONFIG__`) depuis les env `*_URL`.
3. Boucle `npx prisma migrate deploy` jusqu'à succès (retry si la DB n'est pas encore prête).
4. `exec node server.js`.

> Conséquence pour un agent : l'app **ne démarre pas** tant que les migrations n'ont pas
> été appliquées avec succès.

## docker-compose (dev/local — `docker-compose.yml`)
- `db` : `postgres:18.1-alpine3.23`, base `chauffagistes`, port `5432`, healthcheck `pg_isready`.
- `app` : build local, `depends_on db (healthy)`, `env_file: .env`, port `3002`.

## CI/CD (GitHub Actions — `.github/workflows/`)
- `build.yml` — sur push (toutes branches + tags `v*.*.*`), PR, dispatch. Appelle le
  workflow réutilisable `les-chauffagistes/deploy/.github/workflows/build.yml@develop`
  pour construire l'image `heatboard` (target `runner`).
- `claude.yml`, `claude-code-review.yml` — automatisations Claude (revue de code).

## Setup local (depuis le README)
```shell
npm i
# démarrer un PostgreSQL (docker-compose up db), configurer .env depuis .env.template
npx prisma migrate deploy
npx prisma db push
npx prisma generate
# peupler avec fixture.sql (données de test)
npm run dev          # ou: npm run dev:mock (API externes mockées)
```
> Note : le repo dépend d'une BDD peuplée par le **history-server** (API privée) ; on ne
> peut pas héberger une instance pleinement fonctionnelle sans ces données. `dev:mock`
> permet de tester l'UI sans les API externes.

## Fichiers d'infra clés
`dockerfile`, `docker-entrypoint.sh`, `docker-compose.yml`, `.dockerignore`,
`prisma.config.ts`, `.github/workflows/*`.
