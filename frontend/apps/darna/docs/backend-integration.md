# Backend Integration Checklist

This document tracks how the Darna frontend connects to each backend capability. Use it as a living checklist while wiring endpoints.

| Feature | Endpoint(s) | Frontend module | Status |
| --- | --- | --- | --- |
| Auth – register/login/refresh/me | `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me` | `src/features/auth` (to create) | ☐
| Listings search + detail | `/api/realEstate/search`, `/api/realEstate/:id` | `src/hooks/useListings`, `src/pages/public/ListingDetail` | ☐ (search wired, detail pending)
| Listing CRUD | `/api/realEstate` (POST/PATCH/DELETE) | `src/features/listings/form` | ☐
| Media upload | `/api/realEstate/:id/media` | `src/features/media` | ☐
| Leads + chat bootstrap | `/api/leads`, `/api/leads/owner`, `/api/chat/...` | `src/features/leads`, `core-realtime` | ☐
| Notifications | `/api/notifications`, `/api/notifications/read(-all)` | `src/features/notifications` | ☐
| Subscriptions | `/api/subscriptions/*` | `src/pages/workspace/Subscriptions` | ☐
| Financing | `/api/financing/*` | `src/pages/workspace/Financing` | ☐
| Daret/Tirelire bridge | `/api/financing/tirelire/proposal`, Tirelire API | `src/pages/workspace/daret/*` | ☐
| Admin dashboards | `/api/admin/metrics`, `/api/admin/...` | `src/pages/admin/*` | ☐

## Immediate Priorities
1. Build a reusable auth store + interceptors (tokens, profile, roles).
2. Protect routes/layouts based on `roles`/`accountType` (visitor vs individual/company vs admin).
3. Replace placeholder pages with real queries for:
   - Listing search/detail (already partially wired) with skeletons.
   - Workspace "Mes annonces" table using `/api/realEstate` scoped to owner.
   - Admin dashboard metrics (basic cards).
4. Surface error/loading states consistently (React Query + toasts).

## Token Handling Plan
- Store `access_token` + `refresh_token` in `localStorage` (or secure cookies later) with expiry metadata.
- Axios request interceptor injects `Authorization` header when token exists.
- Response interceptor catches 401, attempts refresh, and retries once before logging out.
- `AuthProvider` exposes hooks: `useAuth()`, `useRequireRole(role)` for components/routes.

## Route Protection Plan
- Update `router` config to wrap workspace/admin paths with loaders checking `authStore.profile.role`.
- Redirect unauthorized users to `/403` or `/auth/login?redirect=/requested/path`.

Keep this file up to date as each feature moves from ☐ to ☑.
