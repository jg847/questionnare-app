# Sprint 00: Foundation Lock

## Goal

Lock product and implementation contracts before feature coding begins.

## Linked Specs

- SPEC-01 through SPEC-07

## Scope

- Final brief review
- Launch-critical spec set readiness check
- Cross-spec consistency review
- Seed catalog category selection
- Seed catalog shape confirmation
- Seed offer shape confirmation
- Typed recommendation contract confirmation
- Analytics event taxonomy confirmation
- Admin auth approach confirmation
- Local-development fallback behavior confirmation

## Inputs

- brief.md
- docs/\_spec/SPEC-01-project-bootstrap-infrastructure.md
- docs/\_spec/SPEC-02-database-schema-and-migrations.md
- docs/\_spec/SPEC-03-llm-integration-and-recommendation-engine.md
- docs/\_spec/SPEC-04-chatbot-hero-ui.md
- docs/\_spec/SPEC-05-affiliate-tracking.md
- docs/\_spec/SPEC-06-admin-authentication.md
- docs/\_spec/SPEC-07-admin-offer-catalog-management.md

## Deliverables

- Finalized implementation-ready brief
- Launch-critical spec set confirmed as drafted and implementation-ready
- Cross-spec consistency baseline
- Agreed seed catalog categories
- Agreed seed catalog shape
- Agreed typed recommendation contract
- Agreed MVP analytics event taxonomy
- Agreed local-development fallback behavior for early implementation work

## Tasks

1. Re-read the brief and confirm MVP boundaries.
2. Confirm that SPEC-01 through SPEC-07 are drafted, internally consistent, and ready to act as implementation inputs.
3. Re-check launch-critical specs for route, schema, and event consistency.
4. Freeze the canonical recommendation object fields.
5. Freeze the browser session ID contract across chat and tracking.
6. Freeze the MVP analytics event ownership.
7. Confirm the initial seed catalog shape, categories, and target seed size.
8. Confirm the admin auth shape for Sprint 04.
9. Confirm local-development fallback behavior for environment setup, prompt loading, and provider-dependent flows.

## Validation

- No unresolved contradictions remain across SPEC-01 through SPEC-07.
- SPEC-01 through SPEC-07 are complete enough to serve as implementation inputs without re-drafting.
- Recommendation, tracking, auth, and analytics contracts are all named consistently.
- Seed catalog assumptions and shape are concrete enough to implement without re-planning.
- Local-development fallback behavior is explicit enough to avoid setup ambiguity during Sprint 01 and Sprint 02.

## Exit Criteria

- The brief and launch-critical specs are treated as the working source of truth.
- The launch-critical spec set is confirmed as implementation-ready.
- Sprint 01 can start without reopening product decisions.

## Out of Scope

- Writing feature implementation code
- Starting post-MVP features
