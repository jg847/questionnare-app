## ToolMatch AI: Product Brief and Implementation Readiness Plan

---

## Purpose

This document defines the product, scope, architecture, delivery order, and quality bar for **ToolMatch AI**, an AI-powered software recommendation platform.

The goal of this document is not only to describe the product, but to make the repository **implementation-ready**. That means:

- the MVP scope is explicit
- launch-critical work is separated from later enhancements
- ambiguous product decisions are resolved up front
- specifications can be written directly from this brief
- the first implementation sprint can begin without re-litigating core behavior

Read this document fully before creating any code.

---

## Product Summary

**Working title:** ToolMatch AI  
**Category:** Software tool recommendation platform  
**Primary user:** Individuals and small teams evaluating software tools  
**Primary value proposition:** Help users identify the right software tool for their needs through a conversational advisor and deliver ranked recommendations with tracked outbound clicks.

### Core User Journey

1. A user lands on the homepage.
2. A chatbot named **Arlo** begins a guided conversation.
3. The system gathers context about team size, use case, budget, and priorities.
4. The recommendation engine returns ranked software recommendations.
5. Recommendations are displayed inline in the chat as structured cards.
6. Outbound clicks are tracked for affiliate and analytics purposes.
7. An admin manages offers, prompts, and reporting from a protected dashboard.

---

## Product Goals

### Business Goals

- Generate qualified outbound affiliate traffic.
- Learn which software categories and offers drive engagement.
- Provide a reusable recommendation platform that can expand to multiple niches later.

### User Goals

- Understand which tools fit their situation without browsing dozens of comparison sites.
- Receive concise, explainable recommendations.
- Reach the vendor site quickly once they are ready to evaluate.

### Success Metrics for MVP

- User can complete the chat flow and receive recommendations without manual intervention.
- At least one tracked outbound click path works end-to-end.
- Admin can add and edit offers without direct database access.
- Recommendation response format is deterministic enough for rendering and testing.

### Delivery Constraint

This project should be planned as a **simple 2-week build**, not a full production SaaS launch. Any requirement that materially increases setup, integration, or testing cost without strengthening the core user loop should be deferred.

---

## MVP Definition

The MVP is the smallest production-worthy version that proves the core loop.

### In Scope for MVP

- Public homepage with chatbot hero
- OpenAI-backed conversational flow
- Structured recommendation response with 3 to 5 ranked offers when enough eligible matches exist, capped at 5
- Simple rule-based fallback when LLM output fails
- Offer catalog stored in Supabase
- Affiliate click tracking with SubID and UTM parameters
- Minimal admin authentication
- Admin offer catalog CRUD
- Minimal analytics sufficient to inspect clicks and recommendation generation
- Basic test scaffolding

### Explicitly Deferred Until After MVP Validation

- Multi-role admin permissions
- Complex personalization beyond questionnaire context
- Email capture workflows beyond a simple save-results prompt, such as validation, persistence, or follow-up messaging
- Anthropic provider integration and multi-provider orchestration
- Advanced analytics segmentation, cohorting, or attribution modeling
- Recommendation explanations that cite external sources or live vendor data
- Payment flows, subscriptions, or user accounts for public users
- Prompt versioning UI and prompt sandbox testing
- CI/CD hardening beyond a simple deployable baseline
- Source export tooling

### Launch-Critical Specs

These specs are required before the product can be considered launch-ready:

- SPEC-01: Project Bootstrap & Infrastructure
- SPEC-02: Database Schema & Migrations
- SPEC-03: LLM Integration & Recommendation Engine
- SPEC-04: Chatbot Hero UI
- SPEC-05: Affiliate Tracking
- SPEC-06: Admin Authentication
- SPEC-07: Admin Offer Catalog Management

### Post-Launch Specs

These should be treated as phase-two enhancements unless the schedule allows:

- SPEC-08: Admin System Prompt Editor
- SPEC-09: Analytics Dashboard expansion
- SPEC-10: Source Code Export CLI

### Simple Build Mode

If schedule pressure appears during implementation, preserve only this slice:

1. Landing page with chatbot
2. Small seeded offer catalog
3. Recommendation generation
4. Click tracking
5. Single admin login and offer CRUD

Everything else is optional until that slice works end-to-end.

---

## Resolved Product Decisions

These decisions remove ambiguity before implementation.

### Recommendation Criteria

Recommendations must be ranked using these dimensions:

1. Category fit with the stated use case
2. Team-size fit
3. Budget fit
4. Priority fit, such as ease of use, collaboration, automation, integrations, or price
5. Offer status and eligibility, including `is_active`

If the LLM produces malformed output or references invalid offers, the system must fall back to rule-based scoring using the same ranking dimensions.

### Admin Access Strategy

For the simple version, admin access should use a single password-protected admin session backed by `ADMIN_SECRET`.

Supabase Auth can be added later if the project expands beyond MVP.

### Analytics Event Taxonomy

The system must emit a minimum viable event set:

- `conversation_started`
- `message_sent`
- `message_received`
- `recommendations_generated`
- `recommendation_clicked`
- `admin_login_succeeded`
- `offer_created`
- `offer_updated`
- `offer_deactivated`

### Recommendation Transparency

Recommendations must be labeled as suggestions, not objective truth. Where affiliate links are present, the UI must support a simple affiliate disclosure near the recommendation or CTA area.

### Seed Catalog Expectation

The initial development catalog should contain enough variety to exercise ranking logic without creating data-entry overhead. Target **8-12 offers** across a few categories.

---

## Non-Goals

The following are intentionally out of scope for the first implementation cycle:

- Building a generic AI chat product
- Supporting arbitrary niches beyond software tools
- Ingesting vendor catalogs automatically from third-party APIs
- User account creation for public visitors
- Fine-tuning proprietary LLM models
- Building a CRM or email marketing system

---

## Repository Setup

Initialize the project as a **Next.js 14+ app with the App Router and TypeScript**.

### Required Repository Structure

```text
/
├── app/                        # Next.js App Router pages and API routes
│   ├── (public)/               # Public-facing routes
│   │   └── page.tsx            # Homepage with chatbot hero
│   ├── (admin)/                # Admin dashboard routes (protected)
│   │   ├── dashboard/
│   │   ├── offers/
│   │   ├── prompts/
│   │   └── analytics/
│   └── api/                    # API route handlers
│       ├── chat/
│       ├── offers/
│       ├── track/
│       └── analytics/
├── components/                 # Reusable UI components
│   ├── chat/
│   ├── admin/
│   └── ui/
├── lib/                        # Core business logic, services, utilities
│   ├── ai/                     # LLM integration, prompt engineering
│   ├── db/                     # Database client, queries, migrations
│   ├── tracking/               # Affiliate link and click tracking
│   └── analytics/              # Analytics aggregation logic
├── hooks/                      # Custom React hooks
├── types/                      # Shared TypeScript types and interfaces
├── docs/
│   └── _spec/                  # Feature specifications
├── supabase/
│   ├── migrations/
│   └── seed/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   └── export-source.ts
├── .github/
│   └── workflows/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── jest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Environment Variables

Create a `.env.example` with all required variables documented.

```env
# LLM
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
ADMIN_SECRET=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
```

Implementation note:

- Use `LLM_PROVIDER=openai` only for the simple version.
- `ADMIN_SECRET` is required for the MVP admin flow.
- PostHog integration is optional and must not block MVP functionality.

---

## Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Frontend       | Next.js 14+ App Router, TypeScript                 |
| Styling        | Tailwind CSS + shadcn/ui                           |
| AI / Streaming | Vercel AI SDK                                      |
| LLM Provider   | OpenAI only for MVP                                |
| Database       | Supabase PostgreSQL                                |
| Auth           | Simple admin secret session                        |
| Testing        | Jest, Testing Library, minimal Playwright coverage |
| Hosting        | Vercel                                             |
| Analytics      | Internal event store, optional PostHog             |

---

## Specification Process

Before implementing any feature, create a specification document inside `docs/_spec/`.

### Required Spec Template

```markdown
# Spec: [Feature Name]

**ID:** SPEC-XX  
**Status:** Draft | Ready | In Progress | Complete  
**Sprint:** X

## Summary

One paragraph describing what this feature is and why it exists.

## User Stories

- As a [user], I want to [action] so that [outcome]

## Functional Requirements

Numbered list of concrete requirements the implementation must satisfy.

## Non-Functional Requirements

Performance, security, accessibility, SEO considerations.

## Data Model

Any new database tables, columns, or relationships required.

## API Contract

Endpoints introduced or modified, with request/response shapes.

## UI/UX Notes

Key interaction and layout details.

## Design Patterns

Which SOLID principles and Gang of Four patterns apply and how.

## Test Cases

### Unit Tests

- Positive: ...
- Negative: ...
- Edge: ...

### Integration Tests

- Positive: ...
- Negative: ...
- Edge: ...

### E2E Tests

- Positive: ...
- Negative: ...
- Edge: ...

## Acceptance Criteria

A checklist that must be 100% complete before this spec is marked done.

## Sprint Tasks

Ordered implementation steps that map to a sprint.
```

### Additional Spec Rule

Each spec must distinguish between:

- what must exist for the MVP
- what can be stubbed or deferred
- what assumptions are being made about data, auth, or external services

---

## Features and Specs

Create one spec per feature in the following order.

### SPEC-01: Project Bootstrap & Infrastructure

- Initialize Next.js 14 with TypeScript, Tailwind, and shadcn/ui
- Configure ESLint, Prettier, and strict TypeScript
- Set up Supabase project wiring and database access
- Set up GitHub Actions for CI and deploy
- Set up Vercel deployment
- Create `.env.example`
- Initialize Jest and Playwright base configs

### SPEC-02: Database Schema & Migrations

Implement the full PostgreSQL schema in versioned SQL migrations under `supabase/migrations/`.

Required tables:

- `offers`
- `system_prompts`
- `conversations`
- `messages`
- `recommendations`
- `clicks`
- `analytics_events`

Minimum `offers` fields:

- `id`
- `name`
- `slug`
- `description`
- `category`
- `tags`
- `affiliate_url`
- `logo_url`
- `pricing_model`
- `commission_info`
- `is_active`
- `created_at`
- `updated_at`

### SPEC-03: LLM Integration & Recommendation Engine

Implement:

- `ChatService` for conversation orchestration
- `RecommendationEngine` for ranking and normalization
- Structured JSON output parsing
- Rule-based fallback scoring
- `LLMProvider` interface if it keeps the implementation simple, otherwise use a single OpenAI service for MVP
- OpenAI integration as the only required provider
- Prompt loading from a local constant or seeded database row for MVP
- Token budget controls

The system prompt must instruct Arlo to:

1. act as a friendly software advisor
2. ask 4 to 6 conversational questions
3. detect when enough context is available
4. return ranked structured recommendations with `offer_id`, `match_score`, and `match_reason`

### SPEC-04: Chatbot Hero UI

- Full-screen or high-emphasis hero chat experience
- Streaming chat interface
- Typing indicator
- Quick-reply chips
- Auto-scroll behavior
- Inline recommendation cards
- Email capture prompt after recommendations are shown
- Browser session ID persistence
- Mobile responsiveness
- Accessibility support
- Affiliate disclosure near recommendations

### SPEC-05: Affiliate Tracking

- POST to `/api/track/click` before opening external links
- Generate SubID using `{session_id}-{offer_id}-{timestamp}`
- Append UTM parameters
- Log clicks to the database
- Ensure tracking is fire-and-forget
- Deduplicate duplicate clicks within 5 seconds

### SPEC-06: Admin Authentication

- Single admin password login using `ADMIN_SECRET`
- Protected `/admin/*` routes
- Login page
- Session persistence
- Logout flow

### SPEC-07: Admin Offer Catalog Management

- Offer list view
- Create offer flow
- Edit offer flow
- Soft delete via `is_active = false`
- Search and filter support
- Offer preview

### SPEC-08: Admin System Prompt Editor

- View active prompt
- Save a new version
- View version history
- Test draft prompt in a sandbox
- Revert to prior versions

### SPEC-09: Analytics Dashboard

- Total conversations
- Recommendation generation rate
- Total clicks
- Top clicked offer
- Funnel chart
- Top 5 offers by clicks
- CTR per offer
- Last 30 days activity chart

For MVP, only the minimum metric set required to validate system usage must be implemented. A chart-heavy dashboard should be deferred.

### SPEC-10: Source Code Export CLI

Create `scripts/export-source.ts` executable through `npx ts-node scripts/export-source.ts` and `npm run export`.

It must:

- recursively collect `.ts`, `.tsx`, `.sql`, and `.json` files except lockfiles
- exclude generated and dependency directories
- write a concatenated export file under `exports/`
- print total files, total lines, and output path

---

## Architecture and Design Principles

### SOLID Requirements

- **Single Responsibility:** keep orchestration, ranking, tracking, analytics, and persistence separate
- **Open/Closed:** new providers or scoring strategies must be addable without modifying high-level orchestration
- **Liskov Substitution:** all provider implementations must be interchangeable through the same interface
- **Interface Segregation:** avoid broad service interfaces
- **Dependency Inversion:** high-level services depend on abstractions rather than concrete SDK clients

### Required Design Patterns

- **Strategy:** provider selection and fallback scoring
- **Factory:** provider construction from environment settings
- **Observer:** analytics event emission without tight coupling
- **Repository:** database access behind repository classes
- **Builder:** prompt assembly from reusable sections
- **Decorator:** logging, retry, and error-handling wrappers around provider calls

---

## Testing Strategy

Every spec must define positive, negative, and edge coverage.

### Unit Tests

- Mock all external services including database and LLM calls
- Validate ranking, parsing, prompt assembly, and tracking utilities in isolation

### Integration Tests

- Validate API route behavior against a dedicated test database
- Cover auth failures, malformed payloads, and fallback paths

### E2E Tests

Required critical journeys:

- chat to recommendations
- recommendation click tracking
- admin login
- admin offer create, edit, deactivate

Prompt editing and advanced analytics E2E tests are deferred until those specs move into active implementation.

### Coverage Target

- Focus on critical-path coverage rather than broad test quantity
- Unit coverage for ranking, parsing, and tracking logic should be prioritized
- One or two critical-path E2E flows are sufficient for the simple build

---

## CI/CD Requirements

For the simple version, keep automation lean. A working local build and one deploy path matter more than an elaborate pipeline.

### `ci.yml`

Run on every push and pull request to `main` and `develop`:

- install dependencies
- type check with `tsc --noEmit`
- lint
- run unit tests
- optionally run Playwright E2E against a local server if setup time allows

### `deploy.yml`

Run on push to `main`:

- run CI checks first
- deploy to Vercel via CLI using secrets

---

## Sprint Plan

### Pre-Implementation Sprint

Before writing feature code, complete these tasks:

1. Finalize this brief
2. Create `docs/_spec/` and draft specs for SPEC-01 through SPEC-07 at a lightweight level
3. Decide seed catalog shape and sample categories
4. Define the typed recommendation response contract
5. Define initial analytics event schema
6. Confirm the admin auth approach and local-development fallback behavior

### Two-Week Baseline Schedule

1. Days 1-2: project scaffold, database schema, seed offers
2. Days 3-5: chat flow, prompting, recommendation response contract
3. Days 6-8: homepage UI and recommendation cards
4. Days 9-10: click tracking and admin login
5. Days 11-12: offer CRUD
6. Days 13-14: testing, cleanup, deploy, smoke test

### Implementation Sequence

| Sprint | Specs                     | Goal                                   |
| ------ | ------------------------- | -------------------------------------- |
| 1      | SPEC-01, SPEC-02          | Infrastructure, schema, seed data      |
| 2      | SPEC-03, SPEC-04          | Recommendation flow and public chat UI |
| 3      | SPEC-05, SPEC-06, SPEC-07 | Tracking, admin login, offer CRUD      |
| Later  | SPEC-08, SPEC-09, SPEC-10 | Enhancements only after MVP works      |

### Implementation Phases

The implementation should be executed in gated phases so the team can stop at a working slice without carrying unnecessary scope forward.

#### Phase 0: Foundation Lock

Goal: ensure the project can be started without reopening product decisions.

Includes:

- final brief review
- spec review and cross-spec consistency check
- seed catalog categories and sample offers
- typed recommendation contract confirmation
- analytics event taxonomy confirmation

Exit criteria:

- brief and launch-critical specs are treated as the working source of truth
- no unresolved contract conflicts remain between SPEC-01 through SPEC-07

#### Phase 1: Platform Skeleton

Goal: make the repository runnable, deployable, and ready for feature work.

Specs:

- SPEC-01
- SPEC-02

Includes:

- Next.js scaffold
- Tailwind and shadcn/ui setup
- Supabase wiring
- SQL migrations
- seed data
- `.env.example`
- Jest and Playwright base configuration
- CI and deploy baseline

Exit criteria:

- the app boots locally
- database migrations run cleanly
- seeded offers exist
- deployment baseline is in place

#### Phase 2: Recommendation Core

Goal: make the backend recommendation loop work before polishing the UI.

Specs:

- SPEC-03

Includes:

- `POST /api/chat`
- `ChatService`
- `RecommendationEngine`
- OpenAI integration
- prompt loading
- deterministic fallback scoring
- persistence of conversations, messages, and recommendations
- emission of chat-owned analytics events

Exit criteria:

- a chat request with enough context returns structured recommendations
- fallback recommendations work when the provider fails
- recommendation results persist correctly
- `conversation_started`, `message_sent`, `message_received`, and `recommendations_generated` are emitted

#### Phase 3: Public Chat Experience

Goal: connect the recommendation core to a user-facing homepage flow.

Specs:

- SPEC-04

Includes:

- hero chat page
- transcript rendering
- loading and streaming-capable response UI
- quick replies
- inline recommendation cards
- session ID persistence
- affiliate disclosure
- non-blocking save-results prompt

Exit criteria:

- a user can complete the core chat journey from the homepage
- recommendations render inline with the expected fields
- the browser `session_id` is reused across chat turns

#### Phase 4: Monetization and Access Control

Goal: make clicks measurable and protect the admin surface.

Specs:

- SPEC-05
- SPEC-06

Includes:

- `/api/track/click`
- SubID generation and propagation
- click persistence and deduplication
- admin login
- admin session handling
- route and API protection

Exit criteria:

- recommendation CTA clicks are tracked end-to-end
- outbound links include the required UTM parameters and `sub_id`
- admin login works through `ADMIN_SECRET`
- protected admin routes are inaccessible without authentication

#### Phase 5: Admin Operations and MVP Hardening

Goal: complete the launch-critical admin flow and stabilize the MVP.

Specs:

- SPEC-07

Includes:

- offer list, create, edit, and deactivate flows
- search and filter behavior
- admin-side analytics event emission for catalog mutations
- critical-path testing
- cleanup, smoke testing, and deploy verification

Exit criteria:

- an admin can manage offers without database access
- soft deletion preserves historical compatibility
- critical MVP paths pass local verification

#### Phase 6: Post-MVP Enhancements

Goal: expand the product only after the MVP loop is working and validated.

Specs:

- SPEC-08
- SPEC-09
- SPEC-10

Includes:

- prompt management UI
- richer analytics dashboard
- source export tooling

Rule:

- do not start this phase until Phases 1 through 5 are working end-to-end in a deployable state

### Phase Prioritization Rule

If time runs short, preserve this implementation order:

1. Phase 1: Platform Skeleton
2. Phase 2: Recommendation Core
3. Phase 3: Public Chat Experience
4. Phase 4: Monetization and Access Control
5. Phase 5: Admin Operations and MVP Hardening

Post-MVP work should not displace unfinished launch-critical functionality.

---

## Definition of Done

A spec is only complete when all of the following are true:

- functional requirements implemented
- acceptance criteria checked off
- unit tests written and passing
- critical-path integration behavior verified
- required E2E tests written and passing where applicable
- CI is green when CI exists for that slice
- no TypeScript errors
- no ESLint errors
- design is consistent with the architecture principles in this document
- the feature is validated in a deployed preview environment when applicable

---

## Immediate Next Step

Do not start implementation code yet.

The next concrete deliverable is to create a lightweight specification set for:

- SPEC-01
- SPEC-02
- SPEC-03
- SPEC-04
- SPEC-05
- SPEC-06
- SPEC-07

Once those specs are drafted and reviewed, implementation can begin with Sprint 1.
