# Spec: Affiliate Tracking

**ID:** SPEC-05  
**Status:** Draft  
**Sprint:** 4

## Summary

This spec defines how outbound recommendation clicks are tracked in ToolMatch AI. It covers the client-to-server click logging flow, SubID generation, UTM parameter handling, deduplication, and the requirement that tracking must never block the user from reaching the vendor site.

## User Stories

- As a user, I want to reach the vendor site immediately when I click a recommendation so that tracking does not slow me down.
- As a product owner, I want outbound clicks logged consistently so that I can measure recommendation performance.
- As a developer, I want a deterministic tracking contract so that recommendation cards, analytics, and click persistence all stay aligned.

## MVP Scope

### Must Exist for MVP

- A tracking API endpoint for recommendation click logging
- Client-side tracking behavior invoked before outbound navigation
- SubID generation using `{session_id}-{offer_id}-{timestamp}`
- UTM parameter appending for recommendation CTA links
- Click persistence in the `clicks` table
- Fire-and-forget behavior that does not block navigation
- Deduplication within a 5-second window for accidental repeat clicks

### Can Be Stubbed or Deferred

- Advanced attribution models beyond direct click logging
- Multi-touch analytics or cross-device identity resolution
- Vendor callback tracking or post-click conversion ingestion
- Retry queues beyond a lightweight non-blocking client/server pattern
- Complex fraud detection beyond simple duplicate suppression

### Assumptions

- Recommendation cards provide `offer_id`, `affiliate_url`, and the browser `session_id`.
- The outbound link target is known at click time.
- The tracking API can persist clicks without waiting for the vendor page to finish loading.
- Simple deduplication keyed by offer and session within 5 seconds is sufficient for MVP.

## Functional Requirements

1. Implement a POST endpoint at `/api/track/click` for recommendation click logging.
2. The client must trigger the tracking request before opening the outbound affiliate URL.
3. The client must generate a SubID using the format `{session_id}-{offer_id}-{timestamp}`.
4. The outbound affiliate URL must include `utm_source=toolmatch`, `utm_medium=recommendation`, `utm_campaign={session_id}`, and a propagated `sub_id` query parameter carrying the generated SubID value.
5. UTM parameters and the `sub_id` query parameter must be appended in a way that preserves any existing affiliate query parameters already present on the outbound URL.
6. The tracking request payload must include at minimum `offer_id`, `session_id`, `sub_id`, `utm_source`, `utm_medium`, `utm_campaign`, and any available `recommendation_id` or `referrer` data.
7. The server must persist the click event in the `clicks` table defined in SPEC-02.
8. A successful non-duplicated click tracking flow must emit the `recommendation_clicked` analytics event from the MVP event taxonomy.
9. Tracking must be fire-and-forget from the user perspective and must not block navigation to the vendor site.
10. The system must deduplicate accidental repeated clicks within a 5-second window for the same session and offer combination.
11. Deduplication must still preserve the first valid click record in the window.
12. The CTA navigation flow must still succeed even if the tracking request fails.
13. The tracking flow must remain compatible with the recommendation card and session behavior defined in SPEC-04.
14. Logged click data must be queryable later for analytics and offer performance reporting.

## Non-Functional Requirements

- Prioritize user navigation speed over perfect tracking completion.
- Keep the tracking flow simple and deterministic.
- Avoid exposing internal tracking failures to end users.
- Ensure the URL parameter logic is consistent across all recommendation CTAs.
- Keep deduplication simple enough to reason about and test during MVP.
- Prefer a transport that supports best-effort delivery during navigation, such as `sendBeacon` or `fetch` with `keepalive`, when practical.

## Data Model

This spec depends on the `clicks` table from [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).

Relevant fields used by this spec:

- `recommendation_id`
- `offer_id`
- `session_id`
- `sub_id`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `referrer`
- `created_at`

No new tables are required for MVP.

This spec also depends on the analytics event taxonomy in [brief.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/brief.md).

## API Contract

Tracking endpoint:

- `POST /api/track/click`

Suggested request shape:

```ts
type TrackClickRequest = {
  recommendation_id?: string;
  offer_id: string;
  session_id: string;
  sub_id: string;
  utm_source: 'toolmatch';
  utm_medium: 'recommendation';
  utm_campaign: string;
  referrer?: string;
};
```

Suggested response shape:

```ts
type TrackClickResponse = {
  tracked: boolean;
  deduplicated?: boolean;
};
```

Behavior requirements:

- successful tracking may return `tracked: true`
- deduplicated duplicate requests may return `tracked: false` and `deduplicated: true`
- the client must not rely on the response before continuing navigation

## UI/UX Notes

- Recommendation CTAs should feel immediate and reliable.
- The user should never be forced to wait on a spinner before leaving for the vendor site.
- Tracking should be invisible unless an internal diagnostic mode is added later.
- Affiliate disclosure near the CTA should remain visible but unobtrusive.
- Existing affiliate parameters on vendor URLs must survive UTM appending.

## Design Patterns

- **Single Responsibility:** SubID generation, URL mutation, click logging, and deduplication should live in focused utilities or services.
- **Observer:** recommendation click events should be loggable without coupling the CTA component directly to analytics internals.
- **Repository:** click persistence should later be handled through a repository or data access module rather than inline SQL in route handlers.
- **Strategy:** deduplication logic can remain a simple strategy now and evolve later without rewriting the public CTA behavior.

## Test Cases

### Unit Tests

- Positive: SubIDs are generated in the required `{session_id}-{offer_id}-{timestamp}` format.
- Positive: UTM parameters and the propagated `sub_id` parameter are appended correctly to outbound affiliate URLs.
- Positive: existing affiliate query parameters are preserved when UTM parameters and `sub_id` are appended.
- Negative: malformed tracking payloads are rejected safely by server validation.
- Edge: missing optional fields such as `recommendation_id` or `referrer` do not break tracking.
- Edge: deduplication logic suppresses repeated clicks within 5 seconds for the same session and offer.

### Integration Tests

- Positive: a valid tracking request inserts a click record into the database.
- Positive: the tracking payload aligns with the `clicks` table schema.
- Positive: a successful non-duplicate click also emits the `recommendation_clicked` analytics event.
- Negative: duplicate tracking requests within 5 seconds do not create duplicate click records.
- Negative: a tracking failure does not require the client to block outbound navigation.
- Edge: a click with a nullable `recommendation_id` is still persisted correctly when `offer_id` and session data are present.

### E2E Tests

- Positive: clicking a recommendation CTA triggers tracking and opens the outbound site.
- Positive: the outbound URL includes the required UTM parameters and propagated `sub_id` parameter.
- Negative: rapid double-clicking does not create multiple click records within the deduplication window.
- Edge: the CTA still navigates even if the tracking endpoint temporarily fails.

## Acceptance Criteria

- [ ] `/api/track/click` exists and accepts the required tracking payload.
- [ ] The client sends a tracking request before opening the outbound recommendation URL.
- [ ] SubIDs are generated in the required `{session_id}-{offer_id}-{timestamp}` format.
- [ ] Outbound URLs include `utm_source=toolmatch`, `utm_medium=recommendation`, `utm_campaign={session_id}`, and the propagated `sub_id` parameter.
- [ ] Existing affiliate query parameters are preserved when UTM parameters and `sub_id` are appended.
- [ ] Valid click records are persisted in the `clicks` table.
- [ ] Successful non-duplicate click tracking emits the `recommendation_clicked` analytics event.
- [ ] Recommendation CTA navigation is not blocked by tracking.
- [ ] Duplicate clicks within 5 seconds are deduplicated.
- [ ] The first click in a duplicate window is preserved.
- [ ] Tracking remains compatible with the browser session ID behavior defined in SPEC-04.
- [ ] Unit, integration, and E2E tests cover the happy path, failure path, and deduplication path.

## Sprint Tasks

1. Define the client-side tracking payload and SubID generation utility.
2. Implement affiliate URL mutation with the required UTM parameters and propagated `sub_id` parameter.
3. Ensure outbound URL mutation preserves existing affiliate query parameters.
4. Implement `/api/track/click` with request validation.
5. Persist click records through the `clicks` schema from SPEC-02 and emit `recommendation_clicked` for successful non-duplicate clicks.
6. Implement 5-second deduplication for repeated clicks from the same session and offer combination.
7. Integrate the recommendation CTA flow so tracking happens before navigation without blocking it.
8. Verify compatibility with the browser `session_id` contract from SPEC-04.
9. Add unit, integration, and E2E tests for click tracking, UTM generation, analytics emission, and deduplication.
