# DealRoom — Approved Product and Implementation Plan

## 1. Project Objective

DealRoom is a MERN-based startup due-diligence and investor collaboration platform.

Founders create startup profiles, investors discover startups and request connections, and accepted connections lead to private Deal Rooms where the participants can communicate, exchange information, evaluate opportunities and track decisions.

This document is the source of truth for the project scope and implementation sequence.

The developer has approved the features and phases below. The coding agent must implement this plan rather than independently redefine the product.

## 2. Locked Technology Stack

### Frontend
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

### Backend
- Node.js 24 LTS
- Express 5
- TypeScript
- REST APIs
- Modular monolithic architecture

### Database
- MongoDB Atlas
- Mongoose

### Authentication and Security
- bcrypt password hashing
- JWT authentication using secure HTTP-only cookies
- Authentication, role and resource-level authorization
- Zod request validation
- Helmet, restricted CORS and rate limiting

### Real-Time Communication
- Node.js ws library
- Native browser WebSocket API
- MongoDB remains the source of truth for persisted messages
- REST APIs provide message history
- WebSockets provide live message delivery

Do not introduce NestJS, Redis, microservices or major additional dependencies without developer approval.

## 3. Global Product Rules

1. The application supports Founder, Investor and Admin roles.
2. A founder manages one startup in this version.
3. Investors can discover published startups but cannot access private Deal Rooms before an accepted connection.
4. Accepting a connection request automatically creates a Deal Room.
5. Duplicate requests and duplicate active Deal Rooms must be prevented.
6. Only authorized Deal Room participants can access its private resources.
7. Investor-private evaluations and notes must not be visible to founders.
8. Deal status transitions must be validated by the backend.
9. Messages must be persisted before they are treated as successfully sent.
10. Reconnecting or reloading must not permanently lose persisted messages.
11. WebSocket communication must enforce authentication and Deal Room membership.
12. Notifications and activity records must correspond to real application events.
13. Important actions and failures must provide understandable feedback in the UI.
14. The implementation must preserve the approved technology stack and phase sequence.
15. Deployment is mandatory for project completion.

# Phase 1 — Project Setup and Architecture

### Features and work

- Initialize the frontend using Vite, React and TypeScript.
- Initialize the backend using Node.js, Express and TypeScript.
- Establish separate client and server directories.
- Configure environment-variable handling and safe configuration defaults.
- Establish the MongoDB connection strategy.
- Define the backend module structure and responsibilities.
- Establish routing, validation, centralized error handling and API response conventions.
- Configure basic Tailwind CSS and shadcn/ui.
- Establish frontend routing and the initial application layout.
- Configure Git and the project README.
- Document the approved architecture and implementation plan.

### Acceptance criteria

- Frontend and backend can be started using documented commands.
- The frontend renders successfully.
- The backend starts successfully.
- Configuration errors are understandable.
- Environment secrets are not committed.
- The proposed module structure supports all subsequent phases.
- Architecture and setup instructions are documented.

Do not implement future-phase features during this phase.

# Phase 2 — Authentication and Authorization

### Features

- Founder registration and login.
- Investor registration and login.
- Logout.
- Current-user/session retrieval.
- Password hashing.
- JWT-based authentication using secure HTTP-only cookies.
- Authentication middleware.
- Role-based authorization.
- Protected frontend routes.
- Backend resource-authorization foundations.
- Appropriate validation and authentication errors.
- Basic authentication forms and user feedback.

Admin account provisioning must not allow arbitrary public registration as an administrator.

### Acceptance criteria

- Users can register, log in and log out.
- Protected endpoints reject unauthenticated requests.
- Role-restricted operations reject unauthorized roles.
- Passwords are not stored in plaintext.
- Authentication secrets are not exposed to the frontend.
- Invalid input and expired or invalid authentication are handled appropriately.

# Phase 3 — Onboarding and Profiles

### Founder onboarding

Collect relevant startup information in multiple steps:

1. Startup basics: name, logo or initials, tagline, description, industry, stage, country, city, founding year and website.
2. Business: problem, solution, target customers, business model and product description.
3. Traction: relevant metrics such as ARR/MRR, revenue, customers, users and growth. Metrics should be optional when they are not applicable.
4. Fundraising: current round, funding target, previous funding and optional equity offered.
5. Team: founder information, founder roles, brief bios and team size.

### Investor onboarding

Collect:

- Name and profile photo.
- Organization.
- Investor type.
- Preferred sectors.
- Preferred startup stages.
- Typical investment range.
- Preferred geography.
- Investment thesis.
- Website or LinkedIn URL.

### Additional features

- Startup profile creation and editing.
- Save-in-progress onboarding.
- Draft and published profile states.
- Startup profile completeness indicator.
- Founder dashboard foundation.
- Investor dashboard foundation.

### Acceptance criteria

- A founder can complete onboarding and create one startup.
- An investor can create and update an investor profile.
- Incomplete onboarding does not create misleading or invalid published profiles.
- The completion indicator reflects actual missing required information.
- Users cannot edit another user's profile without authorization.

# Phase 4 — Startup Discovery

### Features

- Published startup listing.
- Startup detail page.
- Startup cards with key metrics.
- Text search.
- Filtering by industry, stage, location and funding requirement.
- Pagination.
- Save and unsave startups.
- Investor saved-startup list.
- Empty, loading and error states.
- Database-backed querying and suitable indexes.

### Startup card information

Display the logo or initials, startup name, tagline, industry, stage, location, fundraising target and available traction metrics.

The card must not display invented values for missing information.

### Acceptance criteria

- Investors can browse only published startups.
- Search and filters operate on actual database data.
- Pagination works correctly.
- Investors can save and remove saved startups.
- Unauthorized users cannot modify another user's saved-startup records.

# Phase 5 — Connection Requests and Deal Room Creation

### Features

- Investor sends a connection request to a startup.
- Request includes an introductory message.
- Founder views incoming connection requests.
- Founder accepts or rejects a request.
- Investor can view request status.
- Prevent duplicate pending or active requests.
- Acceptance creates a private Deal Room automatically.
- Persist the relationship and relevant timestamps.
- Record important actions in the activity timeline.

### Acceptance criteria

- A request can be accepted or rejected only by an authorized founder.
- Acceptance creates exactly one appropriate active Deal Room.
- Concurrent or repeated requests cannot produce duplicate active Deal Rooms.
- The investor cannot enter the Deal Room before acceptance.
- Request status remains consistent across reloads.

# Phase 6 — Deal Room and Evaluation

### Deal Room overview

Display the startup, connected investor, funding information, deal status and latest activity.

### Deal lifecycle

Implement these controlled states:

Connected → Reviewing → Due Diligence → Decision Pending → Approved / Passed

Not every arbitrary transition is valid. Enforce the approved state transitions on the backend.

### Evaluation

Provide structured investor evaluation categories:

- Market
- Product
- Traction
- Team
- Business Model
- Financials
- Risk

Each category supports a score from 1–10 and relevant notes. Calculate an overall evaluation using a documented, deterministic rule.

This is the investor's assessment, not an objective platform-generated startup-quality score.

### Investor-private notes

- Create and edit private notes.
- Associate notes with the relevant Deal Room and investor.
- Keep private notes inaccessible to founders.

### Information requests

Investors can create requests containing:

- Title.
- Description.
- Priority.
- Due date.
- Status.

Founders can provide a text response and optional external link. Investors can review the response and mark the request resolved.

Do not build a large document-management system.

### Acceptance criteria

- Deal status transitions are validated server-side.
- Evaluation scores are validated and saved.
- Private notes are inaccessible to founders, including through direct API requests.
- Information requests have a clear, persistent lifecycle.
- Only authorized Deal Room participants can access the room's resources.

# Phase 7 — Direct Messaging and WebSockets

### Features

- Direct communication between the founder and investor inside a Deal Room.
- Persistent message storage in MongoDB.
- REST API for sending and retrieving message history.
- Message pagination.
- Authenticated WebSocket connections.
- Real-time delivery of new messages.
- Sender identity and timestamps.
- Unread message indicators.
- Reconnection behavior.
- Recovery of persisted history after reconnecting or reloading.
- Authorization for every conversation and subscription.
- Appropriate connection and delivery error handling.

### Acceptance criteria

- Only authorized participants can read or send messages.
- Messages remain available after page reloads.
- New messages are delivered in real time when the recipient is connected.
- Reconnection does not create duplicate stored messages.
- A disconnected client can retrieve missing persisted messages.
- A WebSocket connection cannot bypass REST authorization rules.

# Phase 8 — Activity, Notifications and Administration

### Activity timeline

Record relevant events such as:

- Connection accepted.
- Deal status changed.
- Evaluation updated.
- Information requested or responded to.
- Message activity where appropriate.
- Relevant startup profile changes.

Activity entries must have an actor, action and timestamp.

### Notifications

Implement persistent in-app notifications for relevant events, including:

- Incoming connection requests.
- Accepted or rejected connections.
- New messages.
- New information requests.
- Information request responses.
- Important Deal Room updates.

Include unread counts and the ability to mark notifications as read.

### Administration

Create a basic admin dashboard with:

- User listing and inspection.
- User suspension.
- Startup moderation.
- Removal or handling of inappropriate published content.
- Basic platform activity.

Keep administration focused on platform moderation. Do not expose private conversations and investor notes through unrestricted admin interfaces.

### Acceptance criteria

- Notifications correspond to real events.
- Unread state persists after reload.
- Activity entries are correctly attributed and ordered.
- Suspended users cannot continue using protected application features.
- Moderation actions are authorized and produce consistent results.

# Phase 9 — UI/UX Polish and Integration

### Features

- Polish the founder dashboard.
- Polish the investor dashboard.
- Polish startup cards and startup discovery.
- Refine onboarding forms.
- Refine Deal Room tabs, evaluation panels and information requests.
- Refine the messaging interface.
- Ensure status indicators are consistent.
- Add reusable loading, empty and error states.
- Add appropriate success feedback.
- Improve responsive layouts.
- Ensure frontend data refreshes correctly after mutations.
- Handle expired sessions, failed requests and WebSocket reconnections.
- Resolve known integration defects.

### Acceptance criteria

- The main user journeys work end to end.
- There are no known critical integration blockers.
- The UI handles loading, empty, success and failure states.
- Layouts remain usable on desktop and mobile.
- No major visible UI action is misleading or nonfunctional.

# Phase 10 — Deployment and Submission

### Features and work

- Deploy the frontend.
- Deploy the backend.
- Configure MongoDB Atlas and production environment variables.
- Configure production CORS, cookies and WebSocket connectivity.
- Verify secure access and private-resource authorization in production.
- Test the deployed application's main user journey.
- Finalize README documentation.
- Document features, technologies, setup, environment variables and run instructions.
- Identify the selected AI tool.
- Document 3–5 genuine AI-assisted development tasks and what was reviewed or corrected.
- Check Git history and remove accidental secrets.
- Ensure the GitHub repository is public and complete.
- Add the live deployment links to the README.

### Acceptance criteria

- The deployed frontend can communicate with the production backend.
- MongoDB connectivity works in production.
- Authentication and protected resources work in the deployed environment.
- Deal Room messaging and reconnect/history recovery work in production.
- The repository and README allow another developer to understand and run the application.
- The live URL and public GitHub repository are available for recruiter evaluation.

# 4. AI-Assisted Development Workflow

Use Kiro to help implement the project incrementally.

For every implementation task:

1. Read the relevant steering files and implementation status.
2. Inspect existing code before proposing changes.
3. Identify requirements, affected modules and acceptance criteria.
4. Present the technical approach for review.
5. Implement only the approved task.
6. Explain changed files and significant decisions.
7. Report which checks were actually executed and their results.
8. Fix identified problems before declaring the task complete.
9. Wait for developer approval before Git commits or pushes.

The developer retains control of the feature scope, phase ordering, architecture approval and repository history.

# 5. Phase Completion Rules

A phase is complete only when:

- All required features assigned to that phase have been implemented.
- Acceptance criteria have been reviewed.
- Relevant behavior has been verified.
- Known problems and limitations have been documented.
- The implementation fits the approved architecture.
- A meaningful Git commit has been reviewed and created.

Do not mark a phase complete merely because code generation has finished.

Do not start the next phase while the current phase has unresolved critical blockers.

Any proposed change to scope, sequence or technology must explain its rationale and receive explicit developer approval.