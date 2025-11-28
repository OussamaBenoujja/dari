# Implementation Roadmap

This roadmap transforms the platform requirements into actionable milestones for the React (JS) frontend. Each milestone lists the main screens, API contracts, and validation criteria.

## Phase 0 – Foundations (Week 0)
- Install runtime deps: `react-router-dom`, `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`, `react-hook-form`, `zod`, `dayjs`, `react-map-gl`, `recharts`, `@react-keycloak/web`, `msw`, `vitest`.
- Add shared packages:
  - `packages/core-config`: env helpers, feature flags, locale helpers.
  - `packages/core-api`: axios client, auth interceptors, Zod schemas per entity, React Query hooks.
  - `packages/core-realtime`: Socket.IO connector, notification/chat stores, context provider.
- Tailwind + design tokens inside `packages/ui-kit`.
- Bootstrap routing skeletons for both apps with placeholder pages and protected layouts.
- Wire `.env` + Docker build args for `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `VITE_KEYCLOAK_URL`.

## Phase 1 – Public Experience (Weeks 1-2)
### Screens
- Landing/Home (hero search, featured listings, Darna/Tirelire CTA blocks).
- Search results (list + map with clusters, filters drawer, pagination/sort).
- Listing detail (gallery, specs, seller profile, financing highlights, lead CTA).
- Auth shells: login, register, email verification, reset password, 2FA prompt, SSO callback.
- System pages: 403/404/500, maintenance, cookies/RGPD consent.

### API Contracts
- `GET /listings` with filters (keywords, geo radius, price range, surface, rooms, amenities, transactionType).
- `GET /listings/:id`, `GET /listings/:id/media`, `POST /leads` (trigger chat thread creation on success).
- Auth endpoints from Keycloak adapter (login/register/verify/2FA) + Darna API for profile bootstrap.

### Acceptance
- Responsive layouts (mobile-first), accessible components (WCAG AA).
- Lead CTA opens auth modal if not authenticated.
- Map clusters interact with list selection.

## Phase 2 – Seller Workspace (Weeks 3-4)
### Screens
- Listing creation wizard (multi-step: basics, media, pricing, availability, compliance, review).
- Listing editing + duplication + delete confirmation.
- "Mes annonces" management table with status pills (draft/published/rejected/promoted).
- Media manager with upload queue, thumbnails, progress bars.

### API Contracts
- `POST /listings` (draft/publish flag), `PUT /listings/:id`, `DELETE /listings/:id`.
- `POST /media/presign`, `PUT` to MinIO signed URL.
- `GET /listings/mine` with pagination/filter.

### Acceptance
- Client-side validation mirrors backend (Zod schemas reused).
- Auto-save drafts, optimistic UI for status changes.

## Phase 3 – Leads, Chat & Notifications (Weeks 5-6)
### Screens
- Inbox overview (leads grouped by listing, unread counters).
- Chat thread view (messages, presence, read receipts, file attachments).
- Notification center (tabs: unread/all, mark all as read, filter by category).

### API & Real-Time
- REST: `GET /leads`, `GET /leads/:id/messages`, `POST /messages`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all`.
- WebSocket namespaces: `/notifications`, `/chat` with events `lead:new`, `message:new`, `message:read`, `notification:new`.

### Acceptance
- Socket reconnect recovery, offline states, typing indicators.
- Toasts for new leads when user is elsewhere in the app.

## Phase 4 – Financing & Tirelire Interop (Weeks 7-8)
### Screens
- Bank partners showcase with indicative rates.
- Credit simulator (loan amount, tenor, rate slider, amortization chart).
- Tirelire discovery page + group list, group detail (members, schedule, contributions), group creation wizard, history & ticketing.

### API
- `GET /financing/banks`, `POST /financing/simulate` (local math fallback if offline).
- Tirelire endpoints: `GET /groups`, `POST /groups`, `GET /groups/:id`, `GET /groups/:id/contributions`, `POST /groups/:id/join`, `POST /tickets`.

### Acceptance
- Deep-link between Darna listing and Tirelire savings plan suggestion.
- Contribution schedule displays reliability score and triggers notifications for overdue payments.

## Phase 5 – Admin Workspace (Weeks 9-10)
### Screens
- Dashboard (KPIs, charts for listings volume, conversions, Tirelire health).
- Moderation queue (listings, reports) with bulk actions.
- Plans & pricing management (CRUD, feature toggles).
- KYC validation tool (document preview, approval workflow, comments).
- System parameters (read-only view) if API exposes.

### API
- `GET /admin/stats`, `GET /admin/reports`, `PATCH /admin/listings/:id/status`, `GET/POST /admin/plans`, `GET /admin/kyc/pending`, `POST /admin/kyc/:id/decision`.

### Acceptance
- Role-based access enforced via route loaders/guards.
- Audit trail UI for moderation/KYC decisions.

## Phase 6 – Polish & Compliance (Week 11)
- i18n scaffolding, FR copy QA.
- Performance passes (code splitting, prefetch, Lazy routes, Lighthouse budget >= 90).
- Accessibility audit, keyboard traps fixed.
- Offline placeholders + loading skeletons.
- E2E smoke tests (Playwright) covering critical journeys.

## Continuous Deliverables
- **Design system:** Expand UI kit with badges, inputs, selects, tabs, toast, modal, data list, timeline, avatars, progress, chip, table, stepper, file dropzone.
- **Telemetry:** Browser logs forwarded via optional API hook.
- **Documentation:** Update storybook-like catalog (Chromatic) and README per milestone.

## Dependencies & Risks
- Require backend swagger/collection to stay up-to-date (sync weekly).
- Map provider key + billing.
- Socket namespaces/protocol must match backend (document events early).
- Ensure Docker base images include `pnpm fetch` for deterministic builds.
