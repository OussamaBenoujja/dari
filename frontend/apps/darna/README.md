# Darna Frontend (React + Vite)

SPA for the Darna platform (real-estate + épargne collective) built with React 19, Vite, PNPM workspaces and shared UI/core packages.

## Prérequis

- PNPM ≥ 10
- Node.js ≥ 20
- Darna backend/API + Keycloak stack running (see project `docker-compose.yml`).

## Variables d’environnement

1. Copiez le fichier d’exemple :

```bash
cp apps/darna/.env.example apps/darna/.env
```

2. Ajustez les URLs si votre stack tourne ailleurs (toutes sont injectées dans Docker via `VITE_*`).

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base HTTP de l’API Darna (`http://localhost:3001/` en local). |
| `VITE_SOCKET_URL` | Namespace Socket.IO pour chat + notifications. |
| `VITE_KEYCLOAK_BASE_URL` | Base Keycloak utilisée par l’adaptateur auth. |
| `VITE_APP_TENANT` | Identifiant de tenant (par défaut `darna`). |
| `VITE_APP_REGION` | Région utilisée pour la personnalisation (`ma`). |

## Lancer l’app Darna

```bash
pnpm --filter @darna/darna-app dev
```

- L’UI consomme directement l’API via `VITE_API_BASE_URL` (liste des annonces, recherche, etc.).
- Les erreurs réseau sont remontées dans l’interface pour faciliter le debug si l’API n’est pas démarrée.

## Lint & build

```bash
pnpm --filter @darna/darna-app lint
pnpm --filter @darna/darna-app build
```

## Structure principale

- `src/routes` : configuration `react-router-dom` (public, auth, workspace, admin, system).
- `src/lib/httpClient.js` : client Axios commun (base URL dynamique, cookies, futurs interceptors auth).
- `src/hooks/useListings.js` : hook React Query pour récupérer les annonces / recherche live.
- `src/components/ListingCard.jsx` : affichage carte d’annonce (prix, localisation, CTA).

Pour développer d’autres domaines (notifications, chat, Daret, admin…), créer des hooks dédiés en s’appuyant sur la même convention `@darna/core-config` + `apiClient` afin de rester compatible Docker.
