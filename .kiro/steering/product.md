# DealRoom — Product Definition

## Product
DealRoom is a startup due-diligence and investor collaboration platform. It allows founders to present their startups and collaborate with investors inside private Deal Rooms.

## User Roles
- Founder
- Investor
- Admin

## Core Workflow
1. A founder registers and creates one startup profile.
2. An investor registers and creates an investor profile.
3. Investors discover, search, filter and save published startups.
4. An investor sends a connection request.
5. The founder accepts or rejects the request.
6. Acceptance automatically creates a private Deal Room.
7. The investor evaluates the startup, records private notes and requests information.
8. Founder and investor communicate inside the Deal Room.
9. The deal progresses through controlled statuses and reaches a final decision.

## Required Features
Authentication, role-based authorization, startup onboarding, investor onboarding, discovery, saved startups, connection requests, Deal Rooms, evaluation, private investor notes, information requests, persistent messages, live messaging, activity timelines, in-app notifications, profile completion and basic admin moderation.

## Product Rules
- A founder manages one startup in this version.
- Only authorized participants may access a Deal Room.
- Investor private notes must never be available to founders.
- Deal status transitions must be enforced by the backend.
- Messages must be persisted; WebSockets provide live delivery rather than replacing database storage.
- One accepted investor-startup relationship must not create duplicate active Deal Rooms.

## Scope
Deliver the agreed features, including the planned nice-to-have items. Do not introduce unrelated major features without explicit approval.