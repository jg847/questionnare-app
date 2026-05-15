# Spec: Admin Offer Catalog Management

**ID:** SPEC-07  
**Status:** Draft  
**Sprint:** 5

## Summary

This spec defines the MVP admin interface for managing the offer catalog in ToolMatch AI. It covers the protected admin list view, create and edit flows, soft deletion via `is_active = false`, search and filtering, offer preview behavior, and the analytics events required when catalog changes are made.

## User Stories

- As an admin, I want to view and search the offer catalog so that I can quickly find the tool I need to update.
- As an admin, I want to create and edit offers through the admin UI so that I do not need direct database access.
- As an admin, I want to deactivate an offer without deleting it so that old recommendation and click records remain intact.

## MVP Scope

### Must Exist for MVP

- A protected admin offer list view
- Offer create flow
- Offer edit flow
- Soft delete behavior implemented as `is_active = false`
- Search and filter controls for the offer list
- Offer preview capability for admin review
- Emission of `offer_created`, `offer_updated`, and `offer_deactivated` analytics events

### Can Be Stubbed or Deferred

- Bulk import or export tooling
- Bulk edit operations
- Advanced multi-field sorting beyond simple helpful defaults
- Revision history or diff view for offer edits
- Scheduling offer activation or deactivation
- Rich media management beyond a stored `logo_url`

### Assumptions

- Offer records use the schema defined in [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).
- Admin access is already protected by the auth flow defined in [docs/\_spec/SPEC-06-admin-authentication.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-06-admin-authentication.md).
- Soft deletion is sufficient for MVP and hard deletion should not be exposed in the admin UI.
- The seeded offer catalog is small enough that simple search and filters are sufficient for Sprint 3.

## Functional Requirements

1. Implement a protected admin offer list view.
2. The offer list must display enough key fields to manage the catalog efficiently, including at minimum name, category, pricing model when present, and active status.
3. Implement an offer create flow that writes new records to the `offers` table.
4. Implement an offer edit flow that updates existing `offers` records.
5. The create and edit flows must support at minimum the MVP `offers` fields from SPEC-02: `name`, `slug`, `description`, `category`, `tags`, `affiliate_url`, `logo_url`, `pricing_model`, `commission_info`, and `is_active`.
6. The admin UI must not expose hard delete for offers in MVP.
7. Deactivating an offer must be implemented as setting `is_active = false`.
8. Deactivated offers must remain in the database and preserve compatibility with historical recommendations, clicks, and analytics.
9. Provide search support for quickly locating offers in the admin list.
10. Provide filter support for at least active status and category.
11. The admin list and filter behavior must allow admins to view and manage inactive offers after deactivation.
12. Provide an offer preview so an admin can inspect how core offer content will appear before or after saving.
13. All offer management routes and APIs must require authenticated admin access from SPEC-06.
14. Invalid offer submissions must be rejected with clear validation feedback.
15. The system must enforce uniqueness of `offers.slug` consistently with SPEC-02.
16. Successful offer creation must emit the `offer_created` analytics event.
17. Successful offer updates must emit the `offer_updated` analytics event.
18. Successful offer deactivation must emit the `offer_deactivated` analytics event.
19. The management flow must stay compatible with recommendation and tracking features that depend on offer records.

## Non-Functional Requirements

- Keep the offer management UI simple enough for Sprint 3 delivery.
- Prefer deterministic form validation over permissive ambiguous behavior.
- Avoid destructive catalog operations that would break historical references.
- Keep the list view fast and understandable for a small MVP catalog.
- Make the admin flows straightforward to test with unit, integration, and E2E coverage.

## Data Model

This spec depends on the `offers` table from [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).

Relevant fields for the MVP admin UI:

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

No new tables are required for MVP.

This spec also depends on the analytics event taxonomy in [brief.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/brief.md).

## API Contract

Suggested protected admin endpoints:

- `GET /api/admin/offers`
- `GET /api/admin/offers/:id`
- `POST /api/admin/offers`
- `PATCH /api/admin/offers/:id`

Suggested request shape for create/update:

```ts
type AdminOfferInput = {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  affiliate_url: string;
  logo_url?: string;
  pricing_model?: string;
  commission_info?: string;
  is_active: boolean;
};
```

Suggested response shape for list rows:

```ts
type AdminOfferListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  pricing_model?: string;
  is_active: boolean;
  updated_at: string;
};
```

Suggested response shape for editing an existing offer:

```ts
type AdminOfferDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  affiliate_url: string;
  logo_url?: string;
  pricing_model?: string;
  commission_info?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

Behavior requirements:

- detail requests return the full editable offer record needed to prefill the edit form
- create requests insert a new offer and return the created record or identifier
- update requests modify an existing offer without deleting historical records
- deactivation is performed through update semantics that set `is_active` to `false`
- inactive offers remain queryable through admin list and detail routes
- protected endpoints must deny unauthenticated access per SPEC-06

## UI/UX Notes

- The offer list should prioritize scanability over dense dashboard styling.
- Search and filters should reduce friction without turning the MVP into a complex admin console.
- Create and edit forms should feel like the same flow with clear save behavior.
- Deactivation should be clearly labeled so the admin understands it is reversible and not a hard delete.
- Inactive offers should remain visible through admin filtering so they can still be reviewed or reactivated later.
- Preview should focus on core offer content, not a pixel-perfect recreation of every public UI surface.

## Design Patterns

- **Single Responsibility:** list querying, offer mutation, validation, and preview mapping should stay in focused components or services.
- **Repository:** offer reads and writes should be encapsulated behind a repository or data access layer rather than spread across route handlers.
- **Observer:** successful catalog mutations can emit analytics events without tightly coupling form logic to analytics internals.
- **Dependency Inversion:** admin UI components should depend on typed contracts for offers and protected APIs rather than ad hoc request handling.

## Test Cases

### Unit Tests

- Positive: valid offer input maps cleanly into the create or update payload.
- Positive: preview rendering shows key offer content from form data.
- Negative: missing required fields prevent submission.
- Negative: duplicate slug validation is surfaced cleanly.
- Edge: deactivation updates `is_active` without removing the offer.

### Integration Tests

- Positive: an authenticated admin can fetch the offer list.
- Positive: an authenticated admin can fetch a full offer record for editing.
- Positive: an authenticated admin can create a new offer record.
- Positive: an authenticated admin can update an existing offer record.
- Positive: a successful create emits `offer_created`, a successful update emits `offer_updated`, and a successful deactivation emits `offer_deactivated`.
- Negative: unauthenticated requests to offer-management routes or APIs are denied.
- Negative: a duplicate slug is rejected consistently with the schema constraint.
- Edge: deactivating an offer preserves the record and updates only the active status rather than deleting the row.
- Edge: inactive offers remain visible through admin list filters and can still be fetched for edit or preview.

### E2E Tests

- Positive: an authenticated admin can view the offer list, create an offer, and see it appear in the catalog.
- Positive: an authenticated admin can edit an offer and observe the updated values in the list or preview.
- Positive: an authenticated admin can deactivate an offer without removing it from historical records.
- Negative: an unauthenticated user cannot access the admin offer management surface.
- Edge: search and filters narrow the visible offer list correctly for a seeded catalog.
- Edge: an admin can switch to inactive offers and still inspect or edit a deactivated record.

## Acceptance Criteria

- [ ] A protected admin offer list view exists.
- [ ] Admins can create offers through the UI without direct database access.
- [ ] Admins can edit existing offers through the UI.
- [ ] Soft delete is implemented as `is_active = false` rather than hard deletion.
- [ ] Search support exists for locating offers.
- [ ] Filter support exists for active status and category.
- [ ] Inactive offers remain visible and manageable through the admin list and filters.
- [ ] Offer preview exists for admin review.
- [ ] The management flow supports the MVP `offers` fields defined in SPEC-02.
- [ ] Duplicate slugs are rejected consistently with the database constraint.
- [ ] Offer-management routes and APIs are protected by the admin auth flow from SPEC-06.
- [ ] Successful create, update, and deactivation actions emit `offer_created`, `offer_updated`, and `offer_deactivated` respectively.
- [ ] Unit, integration, and E2E tests cover the success path, validation path, auth path, and deactivation path.

## Sprint Tasks

1. Define the protected admin offer-management routes and API contracts.
2. Implement the offer list view with the core fields needed for management.
3. Add search and filter controls for active status and category.
4. Add a detail-read path for full editable offer records.
5. Implement shared create and edit form flows with validation.
6. Implement preview behavior for core offer content.
7. Implement offer mutation endpoints for create and update.
8. Implement deactivation as `is_active = false` with no hard delete path.
9. Ensure inactive offers remain accessible through admin list and detail flows.
10. Emit `offer_created`, `offer_updated`, and `offer_deactivated` on successful catalog mutations.
11. Verify auth protection for all offer-management pages and APIs.
12. Add unit, integration, and E2E coverage for list, detail-read, create, edit, deactivation, search/filter, and auth behavior.
