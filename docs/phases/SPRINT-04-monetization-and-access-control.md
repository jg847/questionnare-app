# Sprint 04: Monetization and Access Control

## Goal

Make recommendation clicks measurable and protect the admin surface.

## Linked Specs

- docs/\_spec/SPEC-05-affiliate-tracking.md
- docs/\_spec/SPEC-06-admin-authentication.md

## Dependencies

- Sprint 03 complete

## Scope

- /api/track/click
- SubID generation and propagation
- Required UTM parameter and `sub_id` propagation with affiliate-parameter preservation
- Click persistence and deduplication
- Fire-and-forget, non-blocking CTA navigation
- Admin login
- Admin session handling
- Public login-route behavior and fail-closed auth behavior
- Route and API protection
- Required tracking and auth analytics events

## Deliverables

- Working click-tracking API
- SubID and required UTM propagation on recommendation CTAs with existing affiliate parameters preserved
- Click persistence in the clicks table
- Protected admin login flow backed by ADMIN_SECRET
- Publicly reachable admin login route with fail-closed configuration behavior
- 24-hour inactivity-based admin session handling
- Guarded admin pages and admin-only APIs
- Analytics event emission for recommendation_clicked and admin_login_succeeded

## Tasks

1. Implement outbound CTA tracking integration in the public UI.
2. Implement /api/track/click with request validation and persistence.
3. Add SubID generation, required UTM propagation, and preservation of existing affiliate query parameters.
4. Ensure CTA tracking is fire-and-forget and does not block navigation even when tracking fails.
5. Emit recommendation_clicked for successful non-duplicate tracked clicks.
6. Implement admin login and logout endpoints.
7. Ensure the admin login route remains publicly reachable and is not trapped behind /admin/\* protection.
8. Add fail-closed behavior when ADMIN_SECRET is missing or invalid in non-test environments.
9. Add secure admin session handling with the required 24-hour inactivity timeout.
10. Protect admin routes and APIs with a shared guard.
11. Emit admin_login_succeeded after successful authentication.
12. Add integration and E2E coverage for click tracking and admin auth.

## Validation

- Recommendation CTA clicks are tracked end-to-end.
- Outbound links include the required UTM parameters and `sub_id`, while preserving existing affiliate parameters.
- CTA navigation remains non-blocking even if tracking fails.
- Successful non-duplicate tracked clicks emit `recommendation_clicked`.
- Admin login works through ADMIN_SECRET.
- The admin login route remains publicly reachable.
- Missing ADMIN_SECRET fails closed and does not allow admin access.
- Admin sessions expire after 24 hours of inactivity.
- Successful admin login emits `admin_login_succeeded`.
- Protected admin routes are inaccessible without authentication.

## Exit Criteria

- The product can measure outbound recommendation behavior.
- Recommendation CTA tracking is reliable without degrading the outbound navigation experience.
- The admin surface is protected and ready for catalog management.

## Out of Scope

- Admin offer CRUD screens
- Prompt editor
- Expanded analytics dashboard
