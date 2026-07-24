# Glossaire métier

| Terme | Définition |
|-------|------------|
| **Les Chauffagistes** | Pool de minage Bitcoin indépendante et française (solo mining / collaboratif / pool). |
| **Heatboard** | Nom du dashboard (ce projet). Jeu de mots « heat » (chaleur des mineurs) + « board ». |
| **Pool** | Regroupement de mineurs partageant la puissance de calcul. Ici, désigne aussi la *communauté* de mineurs derrière une adresse. |
| **Community pool** | Pool communautaire, identifiée par l'adresse `COMMUNITY_POOL_ADDRESS` (`bc1qqp9zq4an6nyzhcspz2xfmkcf8rj0p6w94a5gyeu2a7rghxjhnqqsvymz5m`), traitée spécialement dans l'UI. |
| **Worker / mineur** | Une machine de minage. Identifiée par un `workername`. |
| **workername** | Nom d'un worker. Dans les payloads pool il apparaît préfixé de l'adresse : `"{adresse}.{nom}"` (extraire le nom via `ExtractWorkername.fromPool`). |
| **Association / link** | Lien entre un `workername` et un compte utilisateur, matérialisé par la table `workernames`. Passe de `pending` à `done`. |
| **code** | Nombre à 6 chiffres (`111111`–`999999`) généré à la réservation ; le mineur le transmet à la pool pour prouver la possession. |
| **Adresse (BTC)** | Adresse Bitcoin. Sert de clé d'entrée du dashboard (`/board/{address}`) et de `btc_address` dans `workernames`. Un user peut choisir son `address` (table `user`). |
| **hashrate** | Puissance de calcul, exprimée en chaîne suffixée (`"80.0TH/s"`). Fenêtres : 1m, 5m, 1h, 1d, 7d. |
| **shares** | Preuves de travail soumises. `bestshare` / `bestever` = meilleures difficultés atteintes. |
| **weight / poids** | Poids relatif d'un worker dans la pool (utilisé pour le camembert de répartition). |
| **block reward** | Récompense de bloc du réseau Bitcoin (`getBtcBlockReward`, ex. `3.125`). |
| **period** | Granularité de l'historique : `daily` (30 jours, 1 pt/30 min) ou `forever` (1 pt/jour). |
| **Pool API** | API publique de la pool (`API_URL`) fournissant les stats instantanées. |
| **History API / history-server** | Service séparé (`HISTORY_API_URL`) fournissant les séries temporelles. Repo : Les-Chauffagistes/history-server. |
| **Auth API** | Service d'authentification externe (`AUTH_API_URL`), auth par cookies. |
| **BFF** | Backend-For-Frontend : rôle du serveur Next.js (proxy + BDD + WS), voir `architecture.md`. |
| **BEF** | Référence dans l'UI (`GoToBEF`, `bef.png`) — bouton/lien de la marque affiché sur l'accueil. |
| **staging** | Environnements `*.staging.chauffagistes-btc.fr` dont le CORS bloque `localhost:3002` (raison d'être des mocks MSW). |
| **webhook link-workername** | Endpoint appelé **par la pool** pour confirmer une association (`POST /api/webhooks/link-workername`, Bearer `POOL_TOKEN`). |
