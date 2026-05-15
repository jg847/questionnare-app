# Sprint 05: Admin Operations and MVP Hardening

## Goal

Complete the launch-critical admin flow and stabilize the MVP for verification and deployment.

## Linked Specs

- docs/\_spec/SPEC-07-admin-offer-catalog-management.md

## Dependencies

- Sprint 04 complete

## Scope

- Offer list, create, edit, and deactivate flows
- Detail-read support for editing existing offers
- Search and filter behavior for active status and category
- Inactive-offer visibility and management behavior
- Form validation and duplicate-slug handling
- Admin-side analytics event emission for catalog mutations
- Auth protection verification for offer-management routes and APIs
- Critical-path testing
- Cleanup, smoke testing, and deploy verification

## Deliverables

- Admin offer catalog UI
- Create, edit, and deactivate flows
- Full editable offer-record loading for existing offers
- Offer filtering and preview behavior
- Support for the MVP offer field set from SPEC-02
- Validation behavior for invalid submissions and duplicate slugs
- Analytics events for catalog mutations
- MVP smoke test checklist completion

## Tasks

1. Build the protected offer list view.
2. Add the detail-read path needed to prefill edit flows for existing offers.
3. Implement create and edit flows for the MVP offer field set from SPEC-02.
4. Implement validation for invalid offer submissions, including duplicate slug rejection.
5. Implement soft delete via is_active = false.
6. Add search, filters for active status and category, and preview support.
7. Ensure inactive offers remain visible and manageable through admin list and detail flows.
8. Emit offer_created, offer_updated, and offer_deactivated.
9. Verify auth protection for all offer-management pages and APIs.
10. Run critical-path verification for chat, tracking, admin login, and offer CRUD.
11. Clean up obvious defects and verify deploy readiness.

## Validation

- An admin can manage offers without direct database access.
- Existing offers can be loaded through a detail-read path and edited safely.
- The create/edit flow supports the full MVP offer field set.
- Invalid submissions are rejected cleanly, including duplicate slug conflicts.
- Soft deletion preserves historical compatibility.
- Search and filters work for active status and category.
- Inactive offers remain visible and manageable after deactivation.
- Successful catalog mutations emit `offer_created`, `offer_updated`, and `offer_deactivated` as required.
- Offer-management pages and APIs remain protected by admin auth.
- Critical MVP paths pass local verification.
- Deploy verification succeeds for the launch-critical slice.

## Exit Criteria

- The launch-critical MVP is complete and working end-to-end.
- The admin catalog flow satisfies the protected list, detail-read, create, edit, filter, preview, and deactivation requirements from SPEC-07.
- Post-MVP work can be deferred without blocking launch validation.

## Out of Scope

- Prompt editor UI
- Expanded analytics dashboard
- Source export tooling
