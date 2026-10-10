# DealRoom Architecture

## Overview

DealRoom is a MERN-stack application following a modular monolith architecture with clear separation between frontend and backend concerns.

## Technology Stack

### Frontend
- **React 19** - UI library
- **TypeScript 6** - Type safety
- **Vite 8** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Component library foundation
- **React Router v7** - Client-side routing
- **TanStack Query v5** - Server state management
- **React Hook Form + Zod** - Form handling and validation

### Backend
- **Node.js 24 LTS** - Runtime
- **Express 5** - Web framework
- **TypeScript 7** - Type safety with strict mode
- **MongoDB Atlas + Mongoose** - Database and ODM
- **bcrypt** - Password hashing
- **JWT + HTTP-only cookies** - Authentication
- **Helmet + CORS** - Security
- **express-rate-limit** - Rate limiting
- **ws** - WebSocket library (Phase 7)

## Repository Structure

```
dealroom/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   └── layouts/     # Page layouts
│   │   ├── features/        # Feature modules (auth, dealroom, etc.)
│   │   │   └── auth/
│   │   │       ├── components/
│   │   │       └── pages/
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities (API client, query client, utils)
│   │   ├── pages/           # Top-level pages
│   │   └── types/           # TypeScript type definitions
│   └── vite.config.ts       # Vite configuration with proxy
│
├── server/                   # Backend application
│   ├── src/
│   │   ├── config/          # Environment and database configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models (Phase 2+)
│   │   ├── routes/          # Express routes (Phase 2+)
│   │   ├── controllers/     # Request handlers (Phase 2+)
│   │   ├── services/        # Business logic (Phase 2+)
│   │   ├── validators/      # Zod validation schemas (Phase 2+)
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Helper utilities and error classes
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Application entry point
│   └── tsconfig.json        # TypeScript configuration (strict mode)
│
└── docs/                     # Project documentation
    ├── ARCHITECTURE.md       # This file
    └── IMPLEMENTATION_PLAN.md
```

## Backend Architecture

### Layered Architecture

```
Routes → Controllers → Services → Models
```

**Routes** (`src/routes/`)
- Define HTTP endpoints
- Apply middleware (auth, validation)
- Map requests to controller methods
- Minimal logic

**Controllers** (`src/controllers/`)
- Extract request data
- Call service layer methods
- Format responses
- Handle HTTP concerns only

**Services** (`src/services/`)
- Implement business logic
- Coordinate multiple models
- Enforce business rules
- Handle transactions

**Models** (`src/models/`)
- Define Mongoose schemas
- Schema-level validation
- Virtuals and methods
- Database structure

### Middleware Stack

1. **Helmet** - Security headers
2. **CORS** - Cross-origin configuration (credentials enabled)
3. **Rate Limiter** - 100 requests per 15 minutes per IP on `/api/*`
4. **Body Parsers** - JSON and URL-encoded (10MB limit)
5. **Cookie Parser** - Parse HTTP-only cookies
6. **Error Handler** - Centralized error handling (last middleware)

### Error Handling Strategy

**Custom Error Classes:**
- `AppError` - Base operational error
- `BadRequestError` - 400 errors
- `UnauthorizedError` - 401 errors
- `ForbiddenError` - 403 errors
- `NotFoundError` - 404 errors
- `ConflictError` - 409 errors

**Centralized Error Handler:**
- Catches all errors
- Formats consistent responses: `{ success: false, error: string, details?: any }`
- Handles Zod validation errors
- Handles Mongoose errors
- Logs unexpected errors without exposing internals

### API Response Convention

All API responses follow a consistent envelope:

**Success:**
```json
{
  "success": true,
  "data": <response payload>
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": [] // Optional validation details
}
```

### Environment Configuration

**Required Variables:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (≥32 characters)
- `CSRF_SECRET` - CSRF token secret (≥32 characters)

**Optional Variables:**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (default: development)
- `CLIENT_ORIGIN` - CORS origin (default: http://localhost:5173)
- `JWT_EXPIRES_IN` - JWT expiration (default: 7d)

**Validation:**
- Startup fails if required variables are missing
- Secrets must be at least 32 characters

### Database Connection

**Lifecycle:**
1. Environment validation
2. MongoDB connection (blocks server start)
3. Connection event handlers (error, disconnected)
4. HTTP server starts
5. Graceful shutdown on SIGTERM/SIGINT

**Connection String Requirements:**
- MongoDB Atlas cluster
- Include database name
- Recommended: `retryWrites=true&w=majority`

## Frontend Architecture

### State Management

- **Server State** - TanStack Query (caching, refetching, mutations)
- **Form State** - React Hook Form
- **UI State** - Local React state (`useState`, `useReducer`)
- **No global state library** - Not needed for this application

### API Client

**Location:** `client/src/lib/api-client.ts`

**Features:**
- Uses relative URLs (enables Vite proxy)
- Automatically includes `credentials: 'include'`
- Parses consistent response envelope
- Throws errors with server messages
- TypeScript generic typing: `apiRequest<T>(endpoint, options)`

**Usage:**
```typescript
const data = await apiRequest<User>('/api/auth/me')
```

### Routing Strategy

- **React Router v7** - Client-side routing
- **Feature-based pages** - Pages organized by feature module
- **Protected routes** - Wrapper components check authentication (Phase 2+)

### Component Organization

**Shared Components:**
- `components/ui/` - shadcn/ui primitives
- `components/layouts/` - Page layouts

**Feature Components:**
- Colocated with feature modules
- Example: `features/auth/components/LoginForm.tsx`

### Form Handling

**Pattern:**
- React Hook Form + Zod resolver
- Schema validation
- Type inference: `z.infer<typeof schema>`
- shadcn/ui form components

## Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js 24 LTS
- MongoDB Atlas account and cluster

**Environment Setup:**
1. Copy `.env.example` to `.env` in `server/`
2. Configure MongoDB URI and secrets (≥32 characters)
3. No frontend `.env` needed (uses relative URLs)

**Running Applications:**

```bash
# Terminal 1: Backend
cd server
npm run dev  # Runs on http://localhost:5000

# Terminal 2: Frontend
cd client
npm run dev  # Runs on http://localhost:5173
```

### Vite Development Proxy

**Configuration:** `client/vite.config.ts`

Routes `/api` and `/health` requests from frontend (5173) to backend (5000):
- Frontend: `fetch('/health')` → proxied to → Backend: `http://localhost:5000/health`
- Enables same-origin cookie handling in development

### Build Commands

**Frontend:**
```bash
npm run build  # TypeScript check + production build
npm run lint   # ESLint checks
```

**Backend:**
```bash
npm run build  # TypeScript compilation to dist/
npm run lint   # TypeScript type checks only
```

## Security Architecture

### Authentication (Phase 2+)

- **JWT in HTTP-only cookies** - No localStorage, JavaScript cannot access
- **bcrypt password hashing** - Salt rounds: 12
- **Cookie attributes** - HttpOnly, Secure (production), SameSite=Strict

### CSRF Protection (Phase 2+)

- **Signed double-submit cookie pattern**
- CSRF token in readable cookie
- Token validated from X-CSRF-Token header
- Origin validation on sensitive endpoints

### Authorization (Phase 2+)

**Layers:**
1. **Authentication middleware** - Verify JWT
2. **Role-based middleware** - Check user role
3. **Resource-level authorization** - Verify ownership/membership (services layer)

### WebSocket Security (Phase 7)

- Cookie-based authentication during HTTP upgrade
- Origin validation
- Deal Room membership checks on subscription
- Authenticated sender identity enforcement

## Database Design

### Models (Phase 2+)

Planned models with relationships:
- **User** - Authentication and role
- **Startup** - Founder's startup profile
- **InvestorProfile** - Investor details
- **ConnectionRequest** - Request lifecycle
- **DealRoom** - Private collaboration space
- **Evaluation** - Structured investor assessment
- **PrivateNote** - Investor-only notes
- **InformationRequest** - Investor requests
- **Message** - Persistent chat messages
- **SavedStartup** - Investor's saved startups
- **Activity** - Timeline events
- **Notification** - In-app notifications

### Key Constraints

- One startup per founder (unique on `founder`)
- One pending connection request per pair (partial unique index)
- One Deal Room per investor-startup pair (unique compound index)
- Approved/Passed are terminal states

## Deployment Architecture (Phase 10)

### Production Configuration

**Same-origin deployment (recommended):**
- Express serves built frontend
- API at `/api/*`
- WebSocket at `/ws`
- All under same domain

**Cookie Configuration:**
```typescript
{
  httpOnly: true,
  secure: true,  // HTTPS only
  sameSite: 'strict',
  domain: '.dealroom.com'
}
```

### Environment Variables (Production)

- Never commit `.env` files
- Use platform environment variable management
- Rotate secrets regularly
- Use strong secrets (≥32 characters, high entropy)

## Current Phase Status

**✅ Phase 1 Complete:**
- Frontend foundation with React, Vite, TypeScript, Tailwind v4
- Backend foundation with Express, TypeScript, error handling
- MongoDB connection strategy
- Development environment integration
- Architecture documentation

**⏳ Upcoming: Phase 2 - Authentication and Authorization**
