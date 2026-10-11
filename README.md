# DealRoom

DealRoom is a MERN stack application for founders and investors to discover startups, manage introduction requests, and collaborate through private Deal Rooms during due diligence.

## What it does

DealRoom connects the startup discovery workflow to the work that happens after an investor is interested: a founder can review an introduction request, an accepted request creates a private Deal Room, and both participants can use that room to exchange messages and handle due-diligence requests.

## Features

### Accounts and profiles
- Registration and login for founders and investors.
- Password hashing, cookie-based sessions, role-based access control, and CSRF protection for state-changing requests.
- Founder startup profiles with draft saving, publication validation, editing, and profile-completeness feedback.
- Investor profiles describing investment thesis, sectors, stages, geography, and investment range.

### Startup discovery
- Published-startup discovery with search, filters, sorting, and pagination.
- Startup detail pages and a persistent saved-startup list.
- Draft startup profiles are excluded from normal investor discovery.

### Connection requests and Deal Rooms
- Investors can request introductions to published startups.
- Founders can accept or reject requests; rejected requests remain in history and can be followed by a new request.
- Accepting a request creates a private Deal Room for the founder and investor.
- Backend access checks restrict rooms and actions to their participants and permitted roles.

### Due diligence and collaboration
- Structured investor evaluation across Market, Product, Traction, Team, Business Model, Financials, and Risk.
- Investor-private notes that are not exposed to founders.
- Information requests, founder responses, optional supporting links, and request status tracking.
- Deal Room decisions, with Approved and Passed as terminal outcomes in the current implementation.
- Persistent messages stored in MongoDB, live delivery through WebSockets, and sequence-based catch-up when a client reconnects.

### Workspace and administration
- In-app notifications and unread counts.
- Activity timelines for relevant workflow events.
- Profile-completeness indicators.
- Admin tools for user suspension/restoration and startup visibility moderation. Public registration does not allow users to select the admin role.
- Light and dark themes, responsive layouts, and account switching/sign-out controls.

## Technology

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React |
| Routing and data | React Router, TanStack Query |
| Forms and validation | React Hook Form, Zod |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB Atlas, Mongoose |
| Authentication | bcrypt, JWT in HTTP-only cookies, CSRF protection |
| Realtime | `ws` WebSocket server and the browser WebSocket API |
| Security and middleware | Helmet, restricted CORS, request rate limiting, centralized error handling |

The codebase is organized as a modular monolith: the frontend and backend are separate applications, while backend responsibilities are separated into routes, controllers, services, models, validators, and middleware. MongoDB is the source of truth for persisted messages; WebSockets provide live delivery rather than replacing persistence.

## Repository layout

```text
.
├── client/                   # React + Vite frontend
│   └── src/
│       ├── components/       # Shared layout and theme components
│       ├── features/         # Auth, profiles, startups, connections,
│       │                     # Deal Rooms, chat, notifications, activity, admin
│       ├── pages/             # Home, workspace, discovery, detail, Deal Room
│       └── lib/               # API client and query client
├── server/                   # Express API and WebSocket gateway
│   └── src/
│       ├── config/            # Environment and database configuration
│       ├── controllers/       # HTTP request handling
│       ├── middleware/        # Authentication, authorization, validation, errors
│       ├── models/            # Mongoose models
│       ├── realtime/          # WebSocket gateway
│       ├── routes/            # API route registration
│       ├── services/          # Business logic
│       └── validators/        # Request schemas
├── .kiro/steering/            # Product, technology, and workflow context
└── docs/                      # Architecture and implementation notes
```

There is no root `package.json`; install and run the frontend and backend from their respective directories.

## Requirements

- Node.js 24 LTS recommended.
- npm (bundled with Node.js).
- A MongoDB Atlas cluster or another MongoDB deployment that supports transactions. The messaging implementation uses transactions to persist messages with their per-room sequence.
- Network access from your machine to the database. For Atlas, add your current IP address to the project's Network Access list and use a database user with appropriate read/write permissions.

## Local setup

### 1. Configure the backend

In a terminal at the repository root:

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

Open `server/.env` and set the required values:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<random-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
CSRF_SECRET=<different-random-secret-at-least-32-characters>
```

Replace every placeholder. Use distinct, randomly generated values for `JWT_SECRET` and `CSRF_SECRET`; both must be at least 32 characters long. URL-encode special characters in the MongoDB username or password when required by the connection string. Do not commit `server/.env` or share production credentials.

Start the backend:

```powershell
npm run dev
```

The API listens on `http://localhost:5000` by default. Keep this terminal running.

### 2. Configure and start the frontend

Open a second terminal from the repository root:

```powershell
cd client
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser. During development, Vite proxies `/api`, `/health`, and WebSocket traffic to the backend on port `5000`. The optional `VITE_API_URL` setting in `client/.env.example` can be used to override the API base URL if needed.

### 3. Confirm the backend is reachable

Open `http://localhost:5000/health`, or run:

```powershell
curl.exe -i http://localhost:5000/health
```

A successful response returns JSON with `success: true` and `data.status: "ok"`. This confirms the health endpoint responds; authenticated and database-backed flows should also be verified in the application.

## Useful commands

Run each command from its application directory.

### Backend (`server/`)

```bash
npm run dev              # Development server with reload
npm run build            # Compile TypeScript
npm run start            # Start compiled server (run build first)
npm run lint             # TypeScript check without emitting files
npm test                 # Unit tests; no database required
```

The optional integration suite uses a real MongoDB database and WebSocket connections. It must only be run against a dedicated test database whose database name contains `test`—never against development or production data:

```powershell
$env:TEST_MONGODB_URI = "mongodb+srv://<user>:<encoded-password>@<cluster>/<dealroom_test>?retryWrites=true&w=majority"
npm run test:integration
Remove-Item Env:TEST_MONGODB_URI
```

The integration suite creates test records and removes the records it created; it does not drop the database. The MongoDB deployment must support transactions.

### Frontend (`client/`)

```bash
npm run dev              # Vite development server
npm run build            # Type-check and create production assets
npm run lint             # ESLint
npm run preview          # Preview the production build locally
```

## Initial administrator (optional)

Public registration intentionally permits only founder and investor roles. To create the first administrator for a local environment, configure the backend `.env`, then set the bootstrap values in your shell and run the command once from `server/`:

```powershell
$env:ADMIN_BOOTSTRAP_NAME = "DealRoom Admin"
$env:ADMIN_BOOTSTRAP_EMAIL = "admin@example.com"
$env:ADMIN_BOOTSTRAP_PASSWORD = "<unique-password-16-to-128-characters>"
npm run bootstrap:admin
Remove-Item Env:ADMIN_BOOTSTRAP_NAME
Remove-Item Env:ADMIN_BOOTSTRAP_EMAIL
Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD
```

Use a dedicated administrator password and keep it out of tracked files, screenshots, and shared logs. The bootstrap command refuses to create another administrator or reuse an existing email. Do not run bootstrap against a shared or production database unless you intend to create the administrator there.

## AI Development Experience

**Selected assessment tool: Kiro.** Kiro was used during the early project foundation and authentication work. Project steering files were used to keep the product scope, stack constraints, and implementation conventions explicit while changes were made.

Specific tasks where Kiro assisted:

1. **Project foundation:** establishing the separate React/Vite frontend and Express/TypeScript backend, initial routing, environment configuration, database connection setup, and health endpoint.
2. **Authentication implementation:** developing the user model and registration, login, current-user, and logout flows.
3. **Security and validation:** working through password hashing, HTTP-only cookie sessions, role checks, request validation, and CSRF protection.
4. **Authentication UI integration:** connecting registration/login forms and protected frontend routes to the backend session flow.
5. **Debugging and validation:** investigating implementation errors and exercising cases such as duplicate registration, invalid credentials, rejected role assignment, and missing or invalid CSRF tokens.

AI-generated changes were reviewed against the code and observed behavior rather than accepted automatically. I used local builds, lint checks, test cases, and manual browser flows to find and correct issues.

## Security notes

- Keep all secrets in local environment variables or a secret manager; never commit `.env` files.
- Use HTTPS in production so secure cookies and session credentials are protected in transit.
- Configure `CLIENT_ORIGIN` to the exact deployed frontend origin and restrict database network access.
- Do not expose private investor notes, evaluations, session tokens, or database credentials in logs or API responses.
- The API applies authentication, role/resource authorization, request validation, CSRF checks for state-changing requests, security headers, and rate limiting. These controls should be verified as part of deployment checks.

## Deployment

- **Live application:** <!-- Add deployed frontend URL -->https://dealroom-rr7h.onrender.com
- **Backend API:** <!-- Add deployed API URL -->https://dealroom-rr7h.onrender.com/api
- **Health check:** <!-- Add deployed /health URL -->https://dealroom-rr7h.onrender.com/health

## Current scope and limitations

DealRoom implements the core founder/investor workflow through discovery, connection requests, due diligence, messaging, notifications, activity, and basic administration. This repository does not implement investment transactions, payment processing, cap tables, or investment recommendations.
