# Darna Platform Monorepo

A full-stack workspace that powers **Darna**, a real-estate marketplace with financing tools and admin workflows, and **Tirelire**, a collaborative savings companion inspired by Moroccan tontines. This repo packages two Express/Keycloak backends, two React/Vite frontends, shared UI libraries, and the Dockerized infrastructure (MongoDB, MinIO, Keycloak) required to run everything locally or in CI/CD.

> Looking for endpoint-level details? See [`DARNA_API.md`](./DARNA_API.md) and [`TIRELIRE_API.md`](./TIRELIRE_API.md).

---

## Table of contents
1. [Repository layout](#repository-layout)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick start (everything)](#quick-start-everything)
5. [Environment configuration](#environment-configuration)
6. [Day-to-day commands](#day-to-day-commands)
7. [APIs & documentation](#apis--documentation)
8. [Deployment tips](#deployment-tips)
9. [Troubleshooting](#troubleshooting)

---

## Repository layout
```
.
├── apps/
│   ├── darna/         # Darna REST API (Express + TypeScript + Keycloak)
│   ├── tirelire/      # Tirelire collaborative savings API (Express + JS)
│   └── keycloak/      # Custom Keycloak distribution & helper scripts
├── frontend/
│   ├── apps/
│   │   ├── darna/     # React 19/Vite control room & marketplace
│   │   └── tirelire/  # React 19/Vite savings experience
│   ├── packages/
│   │   ├── ui-kit/    # Shared presentational components & styles
│   │   └── core-config/ ... # Env helpers, API clients, realtime wrappers
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── docker-compose.yml # Spins up Mongo, Keycloak, MinIO, both APIs
├── DARNA_API.md       # Backend endpoint reference for Darna
├── TIRELIRE_API.md    # Backend endpoint reference for Tirelire
└── README.md          # (you are here)
```

## Tech stack
| Layer | Technologies |
| ----- | ------------ |
| Frontend apps | React 19, Vite 5, React Router 7, TanStack Query, Zustand, React Hook Form + Zod, Tailwind, Socket.IO client |
| Backend (Darna) | Node 20, Express 5, TypeScript, Mongoose, Keycloak JWT, MinIO, OpenRouter (AI estimates), Socket.IO |
| Backend (Tirelire) | Node 20, Express 4, Mongoose, Keycloak JWT, Stripe Connect stubs |
| Infrastructure | Docker Compose (MongoDB 6, Keycloak 25, MinIO), pnpm workspaces, Jest/Vitest, ESLint/Prettier |

## Prerequisites
- **Node.js 20+** (backend build scripts + Vite dev servers)
- **pnpm 10.23.0+** (already encoded via the `packageManager` field)
- **Docker & Docker Compose** (to boot MongoDB, Keycloak, MinIO, APIs)
- Optional: `direnv` / `nvm` if you want automatic env + Node version switching

## Quick start (everything)
1. **Install JS dependencies** (frontend + backend workspaces share the lockfile)
   ```bash
   pnpm install
   ```
2. **Start infrastructure + APIs** (runs Mongo, Keycloak, MinIO, Darna API, Tirelire API)
   ```bash
   docker compose up -d
   ```
   - Darna API → http://localhost:3001 (Swagger at `/api/docs`)
   - Tirelire API → http://localhost:3002 (Swagger at `/api-docs`)
   - Keycloak → http://localhost:8080 (`realm=darna`, default admin/admin)
   - MinIO → http://localhost:9000 (console on 9001)
3. **Run both frontend apps in dev mode** (from `frontend/`)
   ```bash
   pnpm -r --parallel --stream dev
   ```
   - Darna app → http://localhost:5173
   - Tirelire app → http://localhost:5174
4. **Log in / register** through the Darna app; Keycloak handles tokens which are automatically forwarded to both APIs via the shared Axios client.

> Need just one API? You can use `pnpm --filter darna-api dev` or `pnpm --filter tirelire-api dev` to run them via ts-node/nodemon outside Docker (Mongo + Keycloak still need to be reachable).

## Environment configuration
### Backend (`apps/darna`)
1. Copy `.env.example` to `.env` and adjust at minimum:
   - `PORT` (default `3001`)
   - `MONGO_URI`
   - `KEYCLOAK_URL`, `KEYCLOAK_REALM`, client creds
   - `OPENROUTER_*` keys if you want AI price estimates
2. The Docker image injects secrets via `docker-compose.yml`, so local `.env` is only required when running outside containers.

### Frontend (`frontend/apps/*`)
Environment variables are consumed through `packages/core-config` and **must** start with `VITE_`:
- `VITE_API_BASE_URL` – defaults to `http://localhost:3001/`
- `VITE_SOCKET_URL` – defaults to `ws://localhost:3001`
- `VITE_KEYCLOAK_BASE_URL` – defaults to `http://localhost:8080`
- Optional: `VITE_APP_TENANT`, `VITE_APP_REGION`

You can set these in `frontend/apps/darna/.env.development` (and the Tirelire app) or export them before running Vite.

## Day-to-day commands
| Goal | Command |
| ---- | ------- |
| **Backend build** | `pnpm --filter darna-api build` (emits `apps/darna/out`) |
| **Backend dev server** | `pnpm --filter darna-api dev` |
| **Backend tests** | `pnpm --filter darna-api test` |
| **Frontend lint** | `pnpm --filter @darna/darna-app lint` / `pnpm --filter @darna/tirelire-app lint` |
| **Frontend build** | `pnpm --filter @darna/darna-app build` (outputs to `dist/`) |
| **Run both web apps** | `pnpm dev` from `frontend/` (alias for the parallel Vite command) |
| **Format** | `pnpm format` (check) / `pnpm format:fix` |

## APIs & documentation
- **Swagger UIs**: `http://localhost:3001/api/docs`, `http://localhost:3002/api-docs`
- **Markdown references**: [`DARNA_API.md`](./DARNA_API.md) for listings/leads/financing/admin endpoints, [`TIRELIRE_API.md`](./TIRELIRE_API.md) for savings groups, verifications, tickets.
- **Auth**: Keycloak realm `darna`, clients `darna-api` and `tirelire-api`. Frontend acquires tokens via `/api/auth/*` helpers and stores them in Zustand + React Query caches.

## Deployment tips
- **Docker images**: The provided Dockerfiles build production bundles (`npm run build` for APIs, `pnpm build` for Vite apps). Bake env vars via build args or runtime env injection.
- **Vite env**: Because Vite inlines env vars at build time, remember to set `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, and `VITE_KEYCLOAK_BASE_URL` inside your deployment pipeline (e.g., Netlify/Vercel env panel or Docker secrets).
- **Keycloak data**: The bundled Keycloak image seeds the `darna` realm; mount a volume if you want persistence across restarts.
- **MinIO media bucket**: Default credentials are `minioadmin` / `minioadmin123`. Update `MINIO_*` env vars before production deployments.

## Troubleshooting
| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| `CORS request did not succeed` in the browser | API container not reachable or CORS misconfigured | Ensure `docker compose ps` shows `darna-api` running on port 3001. CORS is currently `origin: true` for dev; tighten later if needed. |
| API 401s even though Keycloak is up | Wrong realm/client or expired token | Re-login via `/auth/login`, verify `.env` values for `KEYCLOAK_*`, and ensure Keycloak realm is `darna`. |
| `MinIO bucket not found` when uploading media | Bucket `darna-media` missing | With MinIO running, create the bucket via the console or CLI: `mc mb minio/darna-media`. |
| Duplicate realm errors when starting Keycloak | Realm already imported in your volume | Clear the Keycloak database volume or set `KEYCLOAK_IMPORT` only when needed. |

---

**Need more context?**
- Frontend architecture & roadmap → [`frontend/ARCHITECTURE.md`](./frontend/ARCHITECTURE.md) and [`frontend/ROADMAP.md`](./frontend/ROADMAP.md)
- Tirelire backend internals → [`apps/tirelire/README.md`](./apps/tirelire/README.md)

Happy hacking! 🏡💸
