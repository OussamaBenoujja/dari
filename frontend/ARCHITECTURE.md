# Darna & Tirelire Frontend Architecture

## Purpose
Design a production-ready React (JS only) workspace that consumes the existing Darna/Tirelire APIs, remains Docker-friendly, and supports real-time chat/notifications, media workflows, and the full set of business journeys described in the project brief.

## Tech Stack & Rationale
- **Build tooling:** Vite + pnpm workspaces for fast HMR and Docker-ready builds.
- **Language:** React 19 with standard JavaScript (no TypeScript as requested) and JSX.
- **Routing:** `react-router-dom@7` data APIs for nested layouts, loaders/actions, and suspense-friendly routing.
- **State/query:**
  - `@tanstack/react-query` for caching server state, retries, pagination, and background refresh.
  - `zustand` for lightweight app/session state (auth profile, feature flags, UI prefs).
- **Forms & validation:** `react-hook-form` + `zod` schemas reused across create/edit flows.
- **HTTP client:** Configurable `axios` instance that auto-injects Keycloak token and handles base URL from `import.meta.env.VITE_API_BASE_URL`.
- **Real-time:** `socket.io-client` wired through a shared provider for notifications, chat presence, and live dashboards.
- **Styling:** Tailwind CSS + CSS variables in the shared UI kit for consistency; each app can extend via local tokens.
- **Maps:** `react-map-gl` (Mapbox) for cluster maps, falling back to Leaflet if offline.
- **Charts:** `recharts` for admin dashboards and savings analytics.
- **Date/time:** `dayjs` with timezone & relativeTime plugins.
- **Testing:** Vitest + React Testing Library per app; msw for API mocking.

## Workspace Layout
```
frontend/
├── apps/
│   ├── darna/          # Real-estate marketplace + admin shell
│   └── tirelire/       # Collective savings experience
├── packages/
│   ├── ui-kit/         # Presentational components, tokens, CSS
│   ├── core-config/    # Environment helpers & feature flags
│   ├── core-api/       # Axios client, query hooks, entity schemas
│   └── core-realtime/  # Socket.io wrapper + notification/chat stores
└── shared/ (virtual)
```

## Cross-Cutting Concerns
- **Environment & base URL:**
  - `.env`, `.env.preview`, `.env.production` per app.
  - `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `VITE_KEYCLOAK_URL`, etc.
  - Docker compose injects the correct values via build args to keep deployments portable.
- **Authentication:**
  - Keycloak PKCE via `@react-keycloak/web` wrapped inside a provider; session stored in `zustand` + `react-query` for user profile.
  - Guards implemented as route loaders + `<ProtectedRoute>` component aware of required roles (visitor/owner/company/admin).
  - 2FA, email verification, and SSO callbacks handled as dedicated routes that call API endpoints.
- **Real-Time Messaging:**
  - `packages/core-realtime` exports `useRealtime()` hook plus domain-specific channels: notifications, chat threads, Daret group rooms.
  - Uses auth token handshake and reconnect strategies; UI surfaces unread counts through `zustand` slices.
- **Media uploads:**
  - Upload service requests presigned MinIO URLs then streams files with progress events.
  - Local queue component handles retries and thumbnail generation.
- **Error handling:**
  - Central `ErrorBoundary` per route; toast system (from UI kit) for transient errors.
  - Network layer maps API error codes to human-friendly messages defined in `packages/core-api/errors.js`.
- **Accessibility & i18n:**
  - UI kit enforces WCAG AA color contrast and keyboard navigation.
  - `@formatjs/intl` prepared for future translations (French/Arabic) though default copy is FR.

## App-Level Responsibilities
### `apps/darna`
- Marketing/landing, search + map, listing CRUD, leads inbox & chat, notifications center.
- Financing hub (bank partners, credit simulator) and integration hooks to Tirelire journeys.
- Admin shell surfaces dashboards, moderation, KYC workflows.

### `apps/tirelire`
- Dedicated savings group flows (discovery, onboarding, contribution tracking, history, ticketing).
- Deep-link back to Darna listings and share stateful components (chat, notifications).

## Routing Strategy
- Nested route definitions placed in `src/routes/index.jsx` per app, grouped by feature domain (public, auth, listings, admin, system).
- Data loaders fetch initial data (e.g., listing detail) via `react-query` `dehydrate`/`hydrate` for SEO-friendly hydration.
- Error + pending states handled by route-level components to keep UX consistent.

## Data Layer Contracts
- `packages/core-api/schemas/*.js` define Zod schemas mirroring backend DTOs (Listings, Leads, Notifications, Daret groups, Subscription plans, Financing quotes).
- `createHttpClient(config)` centralizes interceptors (auth, locale, tenant) and metrics logging.
- Query hooks (e.g., `useListings`, `useLeadThreads`, `useSubscriptions`) exposed for components.

## Real-Time Flow (Chat & Notifications)
1. Authenticated user mounts `<RealtimeProvider>`.
2. Provider connects to Socket.IO namespace with JWT, subscribes to user + tenant rooms.
3. Events fan out to domain stores (notifications, chat threads, Daret group presence).
4. UI components consume selectors (unread counts, typing indicators, message lists).

## Docker & Deployment Notes
- Each app builds via `pnpm --filter app build`; output served by Nginx or the existing Node layer.
- `VITE_*` envs injected through Docker build args to avoid hard-coded URLs.
- Shared packages use relative symlinks compatible with PNPM inside containers; `pnpm fetch` used for deterministic CI builds.

## Next Steps
1. Add missing shared packages (`core-config`, `core-api`, `core-realtime`).
2. Install runtime dependencies (router, query, axios, socket.io, zustand, react-hook-form, zod, tailwind, map/charts libs).
3. Scaffold routing/layout for Darna and Tirelire (public + authenticated shells).
4. Implement base API client + auth provider + env helpers.
5. Build key screens incrementally following the implementation roadmap.
