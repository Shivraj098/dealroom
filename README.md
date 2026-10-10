# DealRoom

Startup due-diligence and investor collaboration platform.

## Status

✅ **Phase 1 Complete** - Project setup and architecture established

## Tech Stack

**Frontend:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, shadcn/ui  
**Backend:** Node.js 24, Express 5, TypeScript 7, MongoDB Atlas, Mongoose  
**Authentication:** JWT in HTTP-only cookies, bcrypt password hashing  

## Project Structure

```
dealroom/
├── client/     # React frontend (Vite)
├── server/     # Express backend
└── docs/       # Project documentation
```

## Local Development

### Prerequisites

- Node.js 24 LTS
- MongoDB Atlas account

### Setup

**1. Backend Setup:**

```bash
cd server
npm install
cp .env.example .env
# Edit .env and configure:
#   - MONGODB_URI (your MongoDB Atlas connection string)
#   - JWT_SECRET (at least 32 characters)
#   - CSRF_SECRET (at least 32 characters)
```

**2. Frontend Setup:**

```bash
cd client
npm install
# No .env needed - uses relative URLs with Vite proxy
```

### Running Applications

**Start both applications in separate terminals:**

```bash
# Terminal 1: Backend (must start first)
cd server
npm run dev
# Runs on http://localhost:5000

# Terminal 2: Frontend
cd client
npm run dev
# Runs on http://localhost:5173
```

**The frontend proxies API requests to the backend automatically.**

### Verify Setup

Visit `http://localhost:5173` in your browser. You should see the DealRoom landing page.

Test the integration:
```javascript
// In browser console at http://localhost:5173
fetch('/health').then(r => r.json()).then(console.log)
// Should return: {success: true, data: {status: 'ok', timestamp: '...'}}
```

## Available Commands

### Backend (`server/`)

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm run start    # Run compiled production build
npm run lint     # Run TypeScript type checks
```

### Frontend (`client/`)

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint checks
npm run preview  # Preview production build
```

## Environment Variables

### Backend (`server/.env`)

**Required:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `CSRF_SECRET` - CSRF token secret (minimum 32 characters)

**Optional:**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (default: development)
- `CLIENT_ORIGIN` - CORS origin (default: http://localhost:5173)
- `JWT_EXPIRES_IN` - JWT expiration (default: 7d)

### Frontend (`client/`)

No environment variables required for development. The Vite proxy forwards API requests to `http://localhost:5000`.

## Documentation

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Complete ten-phase roadmap
- [Architecture](docs/ARCHITECTURE.md) - Detailed architecture documentation

## Features (Planned)

DealRoom will include:
- Authentication and role-based authorization (Founder, Investor, Admin)
- Startup onboarding and profile management
- Investor profile and preferences
- Startup discovery with search and filtering
- Connection requests and Deal Room creation
- Private Deal Room collaboration
- Structured investor evaluations
- Information requests and responses
- Persistent messaging with live WebSocket delivery
- Activity timelines and in-app notifications
- Admin moderation dashboard

## Current Limitations

Phase 1 provides the foundation. Business features will be implemented in Phases 2-10:
- ⏳ Authentication (Phase 2)
- ⏳ User profiles and onboarding (Phase 3)
- ⏳ Startup discovery (Phase 4)
- ⏳ Deal Rooms and collaboration (Phases 5-6)
- ⏳ Real-time messaging (Phase 7)
- ⏳ Activity and notifications (Phase 8)
- ⏳ UI/UX polish (Phase 9)
- ⏳ Production deployment (Phase 10)

## License

ISC

---

_Complete feature documentation and deployment instructions will be added in Phase 10._
