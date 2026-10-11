---
inclusion: always
---

# DealRoom — Technology and Architecture Constraints

## Stack recorded in the project

### Frontend (`client/`)
- React 19, Vite 8, TypeScript, Tailwind CSS v4.
- React Router for routes.
- TanStack Query for server state, caching, and invalidation.
- React Hook Form and Zod 3 for client-side form validation.
- `lucide-react` for icons.
- Project-owned React components and CSS utilities/tokens in `client/src/index.css` (including the `dr-*` classes).
- `ThemeProvider` persists the light/dark preference in local storage.

**Component-library accuracy:** `client/components.json` exists, but `shadcn/ui` is not listed as a runtime dependency in `client/package.json`. Do not assume a shadcn component exists or add that dependency without approval; inspect and reuse the components actually present.

### Backend (`server/`)
- Node.js runtime; the approved plan targets Node.js 24 LTS. Verify the actual local/deployment runtime rather than assuming it from TypeScript types.
- Express 5, TypeScript, REST APIs, and a modular monolith.
- Mongoose 9 with MongoDB Atlas.
- Zod 4 for backend request validation (separate from client Zod 3).
- `bcrypt` for password hashing, `jsonwebtoken` for JWTs, `cookie`/`cookie-parser` for cookies, and `ws` for WebSockets.

There is intentionally no root `package.json`. Client and server dependencies and scripts are managed separately.

## Module boundaries

Backend request flow:

`Express middleware → routes → controllers → services → Mongoose models → MongoDB`

- **Routes** register endpoints and compose auth, role, CSRF, and validation middleware.
- **Controllers** handle HTTP details, read the authenticated principal, invoke services, and format the response envelope.
- **Services** enforce business rules, coordinate models, scope queries to the authenticated user/room, and handle transactional work where needed.
- **Models** define persistence, field validation, timestamps, and uniqueness constraints.
- **Validators** validate untrusted request data at the boundary.
- **Middleware** handles authentication, role access, CSRF, and centralized errors.

Frontend request flow:

`page/component → feature API/hooks → client/src/lib/api-client.ts → /api backend`

Use TanStack Query for server state. After mutations, invalidate the relevant query keys rather than manually maintaining unrelated duplicate copies of server data. Keep components focused on UI and form state; do not move business rules from services into the UI.

## API and error conventions

- Successful API responses use `{ success: true, data: ... }`.
- Error responses use `{ success: false, error: ... }` and may include validation details.
- Preserve the API envelope and HTTP semantics when changing behavior.
- The health endpoint is `GET /health`.
- API routes are mounted under `/api`.
- The frontend uses relative API URLs by default, with the Vite development proxy in `client/vite.config.ts`.

## Authentication and request security

- Passwords are hashed with bcrypt; never return password hashes in DTOs or log them.
- The JWT is stored in the HTTP-only `token` cookie, not local storage and not a URL parameter.
- The readable `csrf-token` cookie contains a signed double-submit CSRF token. State-changing browser requests send the same token in the `X-CSRF-Token` header.
- Cookies are configured with `secure` in production and environment-appropriate `sameSite` settings.
- CORS uses `CLIENT_ORIGIN` with credentials; Helmet adds security headers.
- The API has a global rate limiter (currently 100 requests per IP per 15-minute window). Avoid unnecessary polling or retry storms.
- Use authentication, role checks, and resource-level authorization. A frontend guard is not a security boundary.
- When changing auth/session behavior, preserve the distinction between 401 (unauthenticated), 403 (forbidden), validation errors, conflicts, and server failures.
- Never print or commit `.env` contents, credentials, tokens, or live connection strings.

## MongoDB and lifecycle correctness

- MongoDB is the source of truth for profiles, requests, Deal Rooms, evaluations, private notes, information requests, chat messages, notifications, and activity events.
- Preserve unique indexes and query scoping. Application-level checks alone are not sufficient for invariants that need database-level uniqueness.
- Connection requests retain rejected history, while a partial unique index prevents duplicate pending requests.
- A unique index enforces one Deal Room per startup/investor pair for the lifetime of this MVP.
- Chat sequence allocation and message insertion use MongoDB transactions. The MongoDB deployment must support transactions (Atlas replica set is expected).
- Message retries use stable client message IDs to avoid duplicate persistence. Broadcast only messages that have been persisted.
- Do not expose investor-private evaluations or notes through founder DTOs, activity events, notifications, or logs.

## WebSocket constraints

- The WebSocket endpoint is `/api/ws` on the same HTTP server as Express.
- Authenticate the handshake from the HTTP-only session cookie; never put a JWT in the URL.
- Validate the request Origin and authorize membership before subscribing a socket to a room.
- Clients reconnect and request missed persisted messages using room sequence/cursor data. Keep ordering, deduplication, and catch-up behavior intact.
- State-changing message creation goes through the authenticated, CSRF-protected REST endpoint; WebSocket broadcasts are for delivery.

## Environment and deployment

- Server configuration is read in `server/src/config/env.ts`. Required secrets are `MONGODB_URI`, `JWT_SECRET`, and `CSRF_SECRET`; server `.env.example` documents local names.
- The client accepts `VITE_API_URL` when a non-relative API base is required. Do not put secrets in Vite environment variables exposed to the browser.
- Production CORS, cookie security, and WebSocket Origin must agree with the deployed origin.
- The current Express app returns JSON for unmatched routes and does not itself serve `client/dist`. Deployment must intentionally choose static frontend hosting or add a reviewed same-origin static-serving/SPA fallback. Do not assume the frontend is already served by Express.

## Dependency and architecture constraints

- Do not introduce NestJS, Redis, microservices, another database, or major dependencies without explaining the need and getting approval.
- Prefer Node.js built-ins and existing dependencies when adequate.
- Inspect the installed package version and its exports before copying an API from an older library example.
- Keep client and server validation schemas compatible in intent, but respect their separate Zod major versions and APIs.
