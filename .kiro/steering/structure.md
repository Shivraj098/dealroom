---
inclusion: always
---

# DealRoom — Repository Structure

This document maps the current repository so Kiro can locate responsibilities before changing code. Confirm the path and current implementation before editing; the tree can evolve.

## Root

- `.kiro/steering/` — project instructions for product scope, technology, workflow, and code organization.
- `client/` — React/Vite frontend with its own `package.json` and lockfile.
- `server/` — Express/TypeScript backend with its own `package.json` and lockfile.
- `docs/ARCHITECTURE.md` — architecture notes.
- `docs/IMPLEMENTATION_PLAN.md` — approved phased plan and acceptance criteria; known disagreements with the implementation are called out in `product.md` and must not be silently resolved.
- No root `package.json` exists in this repository.

## Frontend (`client/src/`)

- `App.tsx` — React Router route table and authentication/profile routing guard.
- `main.tsx` — React root, TanStack Query provider, theme provider, and React Query devtools.
- `components/layouts/`
  - `AppHeader.tsx` — shared brand/navigation, notifications, theme toggle, account identity, and sign-out control.
  - `AuthLayout.tsx` — shared authentication page layout.
  - `ProtectedRoute.tsx` — authentication and role route guard.
  - `InvestorRoute.tsx` — investor profile/publication guard for discovery.
- `components/theme/ThemeProvider.tsx` — light/dark theme preference and toggle.
- `features/auth/` — auth API hooks, schemas, login, and registration forms/pages.
- `features/profiles/` — founder/investor onboarding forms and profile API.
- `features/startups/` — discovery types and API/query hooks.
- `features/connections/` — connection request types, API hooks, and request-management UI.
- `features/deal-rooms/` — Deal Room API/types, evaluation, private notes, information requests, and chat components/API.
- `features/notifications/` — notification types, queries/mutations, and notification control.
- `features/activity/` — activity feed queries and UI.
- `features/admin/` — admin API/types and user/startup moderation UI.
- `pages/` — home, workspace, startup discovery/detail, Deal Room, and not-found screens.
- `lib/api-client.ts` — central fetch wrapper, cookie credentials, CSRF header, response/error handling.
- `lib/query-client.ts` — TanStack Query client and retry/cache defaults.
- `types/` — shared API and domain types used across features.
- `index.css` — Tailwind entry, theme variables, and shared `dr-*` UI classes.
- `vite.config.ts` — Vite configuration and development API/WebSocket proxy.

## Backend (`server/src/`)

- `server.ts` — connects to MongoDB, starts the HTTP server, attaches the WebSocket gateway, and handles graceful shutdown.
- `app.ts` — Express middleware order, security headers, CORS, rate limiting, body/cookie parsing, health endpoint, API router, 404 and error handlers.
- `config/` — environment validation and MongoDB connection lifecycle.
- `routes/` — route declarations and middleware composition:
  - `auth.routes.ts` — CSRF bootstrap, registration, login, logout, current session.
  - `profile.routes.ts` — current profile and founder/investor profile writes.
  - `startupDiscovery.routes.ts` — investor discovery, startup details, and saved startups.
  - `connection.routes.ts` — list/status/create/accept/reject requests.
  - `dealRoom.routes.ts` — rooms, messages, evaluation, private notes, information requests, and final status.
  - `notification.routes.ts`, `activity.routes.ts`, `admin.routes.ts` — supporting workflows.
  - `index.ts` — mounts feature routers under `/api`.
- `controllers/` — HTTP request/response adapters. Keep them thin.
- `services/` — profile, auth, discovery, connection, Deal Room, chat, notification, activity, and admin business rules.
- `models/` — Mongoose models, schema validation, timestamps, and unique/query indexes.
- `validators/` — Zod request schemas; backend uses Zod 4.
- `middleware/` — authentication, role guards, CSRF protection, request validation, centralized error handling.
- `realtime/chatGateway.ts` — WebSocket upgrade/authentication, origin and room membership checks, subscriptions and persisted-message broadcast.
- `utils/` — cookie options, signed CSRF token utilities, JWT utilities, and error classes.

## Request and data flow

HTTP request:

`Browser UI → feature API/hook → api-client → Express middleware → route → controller → service → Mongoose → MongoDB`

WebSocket flow:

`Browser WebSocket → HTTP server upgrade at /api/ws → origin/session validation → room subscription authorization → persisted message broadcast`

Message writes still use the authenticated, CSRF-protected REST endpoint. WebSockets deliver new persisted messages and support reconnect catch-up; they are not a replacement for storage or REST history.

## Cross-cutting boundaries

- Keep role and resource authorization on the server. Frontend route guards improve UX but do not secure data by themselves.
- Keep private notes and investor evaluations investor-only in service queries and DTOs.
- Preserve connection-request history, the one-pending-request invariant, and one-lifetime-room-per-startup/investor-pair invariant.
- Respect active versus terminal Deal Room status when performing mutations.
- Persist messages before broadcasting; preserve sequence and idempotency behavior.
- Keep notifications/activity scoped to appropriate recipients and do not include private assessment content.
- Use environment variables for secrets. Do not commit `.env` files or print their contents.
