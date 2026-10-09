# DealRoom — Technology Decisions

## Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- React Router
- TanStack Query
- React Hook Form
- Zod

## Backend
- Node.js 24 LTS
- Express 5
- TypeScript
- REST APIs
- Modular monolith architecture

## Database
- MongoDB Atlas
- Mongoose

## Authentication and Security
- Password hashing with bcrypt
- JWT authentication using secure HTTP-only cookies
- Zod validation
- Helmet
- Restricted CORS
- Rate limiting
- Authentication, role and resource-level authorization

## Real-Time Communication
- Node.js ws library
- Native browser WebSocket API
- MongoDB remains the source of truth for persisted messages.
- REST APIs retrieve message history.

## Architecture Rules
- Keep frontend and backend separate.
- Separate routes, controllers, services, models, validators and middleware.
- Keep business logic out of route handlers and React components.
- Validate untrusted input at the backend boundary.
- Enforce resource access permissions in the backend.
- Centralize error handling.
- Use environment variables for secrets and environment-specific configuration.
- Preserve consistent API response conventions.

## Constraints
- Do not use NestJS.
- Do not use Redis.
- Do not introduce microservices.
- Do not add alternative databases or major libraries without discussing the trade-offs first.

## Deployment
The project must be deployed successfully before completion. Deployment configuration must not expose database credentials, JWT secrets or other private values.