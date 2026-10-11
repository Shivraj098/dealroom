---
inclusion: always
---

# DealRoom — AI-Assisted Development Workflow

These are active instructions for coding work. They describe how a task should be approached; they are not a retrospective log claiming that a particular tool performed every historical change.

## Before changing code

1. Read `product.md`, `tech.md`, and `structure.md`. Consult `docs/IMPLEMENTATION_PLAN.md` and `docs/ARCHITECTURE.md` when the task touches their scope.
2. Inspect the current implementation and package scripts. Do not rely only on prior summaries, old plans, or assumptions about a file.
3. Trace the affected user flow through UI, query/mutation hooks, API, route middleware, controller, service, and model where relevant.
4. Identify the expected behavior, acceptance criteria, access-control boundaries, persistence implications, and existing tests.
5. Propose the smallest safe set of changes. List affected files and identify any risk to API contracts, authentication, caching, realtime delivery, or data integrity.
6. If product requirements and implementation disagree, explain the discrepancy and ask for a decision before making a broad or irreversible change.

## Implementation rules

- Implement the requested scope; avoid unrelated refactors, speculative features, decorative filler, and unnecessary abstractions.
- Preserve existing API contracts and database invariants unless the task explicitly authorizes a change.
- Keep business logic in backend services and enforce authorization on the server.
- Reuse existing components, utilities, validation patterns, and dependencies when they fit.
- Never hardcode secrets, credentials, production data, or fake success responses.
- Do not silently replace real data with mocks or weaken validation to make tests pass.
- Update or add tests for important changed behavior when test infrastructure is available.
- Handle error, loading, empty, retry, terminal, and unauthorized states where the feature requires them.

## Verification rules

- This repository has separate `client/` and `server/` packages and no root package script. Run commands from the relevant package directory.
- Inspect `package.json` before assuming a script exists. For the current frontend, the principal checks are `npm run build` and `npm run lint`. For the current server, they are `npm run build` and `npm run lint`; the latter runs TypeScript with `--noEmit` in the current manifest.
- Run the narrowest relevant checks first, then broader build/lint checks when possible.
- Never claim that a test, build, lint, browser flow, or database operation passed unless it was actually executed and its result inspected.
- If a check is blocked by missing dependencies, registry access, credentials, or environment limits, state the exact blocker and leave the check marked unverified.
- Do not run database-mutating integration tests against a developer or production database. Use only an explicitly configured isolated test database for destructive/integration tests, and verify the target before running them.
- Never run admin bootstrap or admin mutation workflows unless the task explicitly requests them.
- For persistence-sensitive work, do not delete or reset existing collections or user data as a debugging shortcut.

## Review before finishing

1. Review the diff for unrelated changes, accidental generated files, credentials, and `.env` changes.
2. Check imports/types and run applicable build, lint, and tests.
3. Check security-sensitive paths: authentication, role and resource authorization, CSRF, private data exposure, rate limiting, WebSocket Origin/membership, and database uniqueness where relevant.
4. Summarize what changed, which files changed, what was verified, what was not verified, and any remaining product decision.
5. Provide a concise commit message when requested. Do not commit or push unless explicitly asked.

## Steering and tool use

- Treat steering as persistent project context for Kiro and future contributors. Keep it concise, specific, and synchronized with the actual codebase.
- Use AI as an implementation aid, not as proof of correctness. Review generated code, preserve the human-approved scope, and verify behavior with real checks.
- Any assignment or project report must attribute tool usage truthfully. Do not invent tool history or claim that a tool was used for work it did not perform.
