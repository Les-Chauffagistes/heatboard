# Heatboard — Graphe de connaissance du projet

> Documentation structurée pour la **programmation agentique**. Chaque fiche est
> autoportante, cite les fichiers sources concernés, et est reliée aux autres via
> le graphe de connaissance (`knowledge-graph.md`).

**Heatboard** est le dashboard public de la pool de minage Bitcoin *Les Chauffagistes*.
C'est une application **Next.js 15 (App Router, React 19)** qui agrège les statistiques
de minage de plusieurs API externes et gère l'association d'un mineur (« workername »)
à un compte utilisateur via une base **PostgreSQL** (accédée par **Prisma**).

## Comment utiliser cette documentation (agents)

1. Commence toujours par `knowledge-graph.md` : il liste les **nœuds** (composants,
   entités, services) et les **arêtes** (dépendances, appels, flux de données).
2. Descends ensuite dans la fiche de domaine pertinente ci-dessous.
3. Chaque fiche indique **les fichiers sources** à lire/modifier : privilégie-les
   plutôt que de re-scanner tout le repo.

## Index des fiches

| Fiche | Contenu | Quand la consulter |
|-------|---------|--------------------|
| [`knowledge-graph.md`](./knowledge-graph.md) | Nœuds, arêtes, diagrammes Mermaid | Point d'entrée, vue d'ensemble des dépendances |
| [`architecture.md`](./architecture.md) | Composants, frontières, rendu SSR/CSR | Comprendre l'organisation générale |
| [`data-model.md`](./data-model.md) | Schéma Prisma + modèles de payloads | Modifier la BDD ou les types de données |
| [`api-internal.md`](./api-internal.md) | Routes `/api/*` Next.js (BFF) | Ajouter/modifier une route serveur |
| [`api-external.md`](./api-external.md) | Pool, Historique, Bitcoin, Auth | Intégrer une API externe / mocker |
| [`frontend.md`](./frontend.md) | Routes UI, pages, hooks, composants | Travailler sur l'UI |
| [`workflows.md`](./workflows.md) | Flux auth + association workername + WebSocket | Comprendre un parcours métier |
| [`configuration.md`](./configuration.md) | Variables d'env, config runtime | Config, secrets, nouvelle variable |
| [`deployment.md`](./deployment.md) | Docker, CI/CD, migrations | Build, déploiement, migration BDD |
| [`glossary.md`](./glossary.md) | Vocabulaire métier | Lever une ambiguïté de terme |
| [`conventions.md`](./conventions.md) | Conventions de code du repo | Écrire du code cohérent |

## Faits saillants (résumé express)

- **Stack** : Next.js 15 `--turbopack`, React 19, TypeScript, Prisma 6 (adapter `pg`),
  PostgreSQL, MUI X Charts, ag-grid, SWR, MSW (mocks), WebSocket (`next-ws`).
- **Port de dev** : `3002` (`npm run dev`, mock : `npm run dev:mock`).
- **Rôle du backend Next.js** : c'est un **BFF** léger. Il proxifie certaines API
  externes (auth, existence d'adresse), gère la BDD des associations workername,
  et expose un WebSocket pour notifier la fin d'association en temps réel.
- **Source des données de minage** : API externes (voir `api-external.md`). Le repo
  ne calcule pas les hashrates, il les affiche.
- **Config injectée au runtime** côté client via `public/config.js`
  (`window.__CONFIG__`), généré par `docker-entrypoint.sh`.
