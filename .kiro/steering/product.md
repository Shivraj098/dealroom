---
inclusion: always
---

# DealRoom — Product Definition

## Product goal

DealRoom is a startup discovery, investor relationship, and due-diligence workspace. Founders publish a startup profile and respond to investor interest. Investors discover and save startups, request introductions, assess opportunities privately, request information, and communicate with founders in a persistent Deal Room.

Optimize for trustworthy workflows and clear decisions. Do not add product features solely to make the interface appear more sophisticated.

## Roles

- **Founder** — maintains one startup profile, publishes or edits it, responds to connection requests and information requests, and participates in its Deal Rooms.
- **Investor** — maintains one investor profile, discovers and saves published startups, sends connection requests, evaluates deals, keeps private notes, requests information, messages founders, and records an outcome.
- **Admin** — performs limited user suspension and startup moderation. Admin functionality must not expose private investor notes or evaluations by default.

## Main workflow

1. A user registers as a founder or investor and completes the corresponding profile.
2. A founder saves a startup profile as a draft and publishes it when required fields are valid.
3. An investor with a published investor profile discovers, searches, filters, sorts, and saves published startups.
4. The investor sends an introduction request, optionally with a message.
5. The startup's founder accepts or rejects the request. A rejected request remains in history, and the investor may request again.
6. Acceptance creates or returns the single Deal Room for that startup/investor pair.
7. The participants use the room for persistent messaging and shared information requests. Investors also maintain a private evaluation and private notes.
8. The investor may finalize an active room as Approved or Passed.

## Product invariants

- One founder may own only one startup profile in this version. An investor may own only one investor profile.
- A draft startup is not discoverable. A published startup hidden by moderation is also excluded from normal discovery.
- Only investors may create connection requests; only the startup's founder may accept or reject them.
- There may be only one pending request for an investor/startup pair. Request history should be preserved after rejection.
- There is at most one lifetime Deal Room per startup/investor pair. Repeated acceptance/retries must not create duplicates.
- Only the founder and investor associated with a Deal Room may access its shared resources. Enforce this on the backend, not just in route guards or the UI.
- Evaluations and private notes belong to the investor and must never be returned to founder-facing APIs or activity descriptions.
- Information requests are shared within the room. Their current implemented lifecycle is `open → responded → closed`.
- Persist messages in MongoDB before broadcasting them. WebSockets deliver new persisted messages; they are not the message store.
- Notifications and activity records must represent real events and must not disclose private assessment content.
- Suspended accounts must not continue using authenticated HTTP features or realtime room subscriptions.
- UI simplification must not remove meaningful fields, access controls, validation, or recovery paths.

## Current implementation limits that must not be silently redefined

The source code and the approved `docs/IMPLEMENTATION_PLAN.md` are not fully aligned in these areas. Treat them as explicit decisions to raise with the project owner before changing schemas, API contracts, or product claims:

1. **Deal lifecycle:** the current `DealRoom` model supports `active`, `approved`, and `passed`, with finalization from `active`. The implementation plan describes additional intermediate states (`Connected`, `Reviewing`, `Due Diligence`, `Decision Pending`). Do not claim those intermediate states exist in the current UI or API.
2. **Evaluation scale:** the current validator/model accepts scores from 1–5. The implementation plan specifies 1–10 and a deterministic overall evaluation rule. The current score range/calculation does not fully meet that plan.
3. **Information request fields:** current requests contain a title and description and support text/link responses plus status. Priority and due-date fields specified in the implementation plan are not present in the current model/API.

Do not silently “fix” these gaps during unrelated tasks. Describe the impact and ask for a decision before expanding the scope.

## Non-goals unless explicitly approved

- Investment transactions, payment processing, cap tables, or legal document workflows.
- Large document-management features.
- Public social networking, video calls, or unrelated analytics.
- AI-generated investment recommendations or fabricated company data.
- Microservices, Redis, or an alternative database.

## Product-quality bar

A user must be able to tell what happened after an action, recover from a failed request, return to persisted work after a reload or new session, and understand which information is private versus shared. Errors, empty states, loading states, and disabled/terminal states are part of the product—not optional polish.
