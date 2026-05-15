# Spec: Analytics Dashboard

**ID:** SPEC-09  
**Status:** Draft  
**Sprint:** 6

## Summary

This spec defines the post-MVP analytics dashboard for ToolMatch AI. It covers the admin-facing metrics used to understand conversation volume, recommendation generation, outbound click performance, and offer-level engagement, while preserving the brief's requirement that only a minimal metric slice belongs in the MVP and that a chart-heavy dashboard is deferred.

## User Stories

- As an admin, I want to see core usage and click metrics so that I can judge whether the recommendation flow is being used.
- As an admin, I want to know which offers are being clicked most so that I can evaluate catalog quality and affiliate performance.
- As a product owner, I want a lightweight funnel view so that I can understand where users are dropping off between conversation start, recommendation generation, and click-through.

## MVP Scope

### Must Exist for This Spec

- An admin analytics view for usage and engagement metrics
- Total conversations metric
- Recommendation generation rate metric
- Total clicks metric
- Top clicked offer metric
- Top 5 offers by clicks view
- CTR per offer view
- Funnel chart or funnel-style summary of the core recommendation journey
- Last 30 days activity chart or equivalent time-series view

### Must Already Exist Before This Spec Expands the Dashboard

- A lightweight MVP analytics foundation sufficient to inspect clicks and recommendation generation
- Reliable emission of the minimum viable analytics event taxonomy from the brief
- Persisted click and conversation data from the MVP recommendation flow

This spec expands that lightweight foundation into a richer admin reporting surface. It should not redefine the MVP requirement itself.

### Can Be Stubbed or Deferred

- Advanced attribution modeling
- Cohorting, segmentation, and retention analysis
- Complex drill-downs by multiple arbitrary dimensions
- Realtime streaming analytics updates
- Cross-device identity stitching
- Chart customization beyond simple admin inspection needs

### Assumptions

- This feature is post-MVP and should not block the simple two-week build.
- Minimal analytics sufficient to inspect clicks and recommendation generation should exist before this dashboard is expanded.
- The underlying event and persistence schema is provided by [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).
- Click records and event taxonomy are produced by the flows described in [docs/\_spec/SPEC-05-affiliate-tracking.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-05-affiliate-tracking.md) and the brief.
- Protected admin access is provided by [docs/\_spec/SPEC-06-admin-authentication.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-06-admin-authentication.md).

## Functional Requirements

1. Implement a protected admin analytics dashboard view.
2. Display total conversations for the selected time window.
3. Display recommendation generation rate for the selected time window.
4. Display total clicks for the selected time window.
5. Display the top clicked offer for the selected time window.
6. Display the top 5 offers by clicks.
7. Display CTR per offer using a deterministic definition documented in the implementation contract.
8. Provide a funnel chart or funnel-style summary that covers at minimum conversation started, recommendations generated, and recommendation clicked.
9. Display last 30 days activity as a chart or equivalent time-series visualization.
10. The dashboard must be able to compute metrics from persisted sources including `conversations`, `clicks`, `recommendations`, and `analytics_events` where appropriate.
11. Metric computation must align with the MVP event taxonomy from the brief, including `conversation_started`, `recommendations_generated`, and `recommendation_clicked`.
12. Total conversations must be defined deterministically as the count of conversation records created in the selected time window, using `conversations.created_at` as the primary source of truth.
13. Recommendation generation rate must be defined deterministically as `conversations with recommendation_generated = true in the selected window / total conversations in the selected window`.
14. CTR per offer must be defined deterministically as `clicks for that offer in the selected window / recommendations for that offer in the selected window`.
15. The funnel must use deterministic stage counts based on the MVP analytics foundation: conversations started, conversations that generated recommendations, and sessions with at least one recommendation click.
16. The dashboard must support a default date range suitable for quick inspection, with a last-30-days view available by default for time-series activity.
17. Protected analytics routes and APIs must require authenticated admin access from SPEC-06.
18. Empty states must render safely when traffic volume is low or no events exist yet.
19. Metric calculations must avoid double-counting duplicate click events that were already deduplicated at the tracking layer.
20. The dashboard must remain compatible with the lightweight MVP analytics foundation rather than requiring a full analytics warehouse.

## Non-Functional Requirements

- Keep this feature explicitly outside the launch-critical MVP path.
- Prefer simple, explainable metric definitions over advanced analytics complexity.
- Keep query logic understandable and testable for a small early-stage dataset.
- Avoid chart-heavy or highly interactive dashboards that materially increase implementation cost without improving basic operational visibility.
- Ensure low-volume and zero-data scenarios are handled gracefully.

## Data Model

This spec depends on the following persistence sources from [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md):

- `conversations`
- `recommendations`
- `clicks`
- `analytics_events`
- `offers`

Relevant fields include:

- `conversations.session_id`
- `conversations.created_at`
- `conversations.recommendation_generated`
- `recommendations.conversation_id`
- `recommendations.offer_id`
- `clicks.offer_id`
- `clicks.session_id`
- `clicks.created_at`
- `analytics_events.event_name`
- `analytics_events.session_id`
- `analytics_events.created_at`

No new tables are strictly required for the initial version of this spec.

If dashboard performance becomes problematic later, rollups or derived tables should be introduced as a follow-on enhancement rather than expanding this first version prematurely.

## API Contract

Suggested protected admin endpoints:

- `GET /api/admin/analytics/summary`
- `GET /api/admin/analytics/offers`
- `GET /api/admin/analytics/activity`
- optional combined endpoint only if it keeps implementation simpler

Suggested query parameters:

- `from`
- `to`

Suggested summary response shape:

```ts
type AdminAnalyticsSummary = {
  totalConversations: number;
  recommendationGenerationRate: number;
  totalClicks: number;
  metricDefinitions: {
    totalConversations: 'count(conversations.created_at in window)';
    recommendationGenerationRate: 'count(conversations where recommendation_generated = true in window) / count(conversations in window)';
  };
  topClickedOffer?: {
    offer_id: string;
    name: string;
    clicks: number;
  };
  funnel: {
    conversationsStarted: number;
    recommendationsGenerated: number;
    recommendationClicks: number;
  };
};
```

Suggested offer-performance response shape:

```ts
type AdminOfferAnalyticsItem = {
  offer_id: string;
  name: string;
  clicks: number;
  recommendations: number;
  ctr: number;
};
```

Suggested activity response shape:

```ts
type AdminAnalyticsActivityPoint = {
  date: string;
  conversations: number;
  recommendationsGenerated: number;
  clicks: number;
};
```

Behavior requirements:

- summary responses return the core admin metrics for the requested time window
- offer-performance responses support top-clicked and CTR views
- activity responses return a last-30-days-compatible time series
- summary and offer-performance responses must use the deterministic metric definitions documented in this spec rather than ad hoc event mixing
- protected endpoints must deny unauthenticated access per SPEC-06

## UI/UX Notes

- The dashboard should prioritize clarity over dense visualization.
- Summary metrics should be immediately scannable.
- Funnel and time-series views should support quick operational inspection rather than deep BI workflows.
- Low-data states should explain that traffic is still limited rather than making the dashboard feel broken.
- The interface should avoid turning into a chart-heavy analytics product during this phase.

## Design Patterns

- **Repository:** analytics reads should be encapsulated behind dedicated query modules or repositories rather than scattered SQL in UI handlers.
- **Single Responsibility:** summary aggregation, offer-level aggregation, and time-series aggregation should remain separate concerns.
- **Observer:** the dashboard depends on events emitted elsewhere, reinforcing analytics as a downstream observer of application behavior.
- **Dependency Inversion:** dashboard UI code should depend on typed analytics contracts rather than direct database logic.

## Test Cases

### Unit Tests

- Positive: summary metric calculations return the expected totals from representative datasets.
- Positive: CTR calculation uses the documented deterministic formula.
- Positive: recommendation generation rate uses the documented deterministic formula.
- Negative: empty datasets return safe zero-value metrics.
- Edge: low-volume data still produces a valid funnel and activity series.
- Edge: deduplicated click records are not counted more than once by dashboard logic.

### Integration Tests

- Positive: an authenticated admin can fetch summary analytics for a date window.
- Positive: an authenticated admin can fetch top-offer and CTR analytics.
- Positive: an authenticated admin can fetch the last 30 days activity series.
- Negative: unauthenticated requests to analytics routes or APIs are denied.
- Negative: invalid date-range inputs are rejected safely.
- Edge: sparse event data still renders a coherent summary response.

### E2E Tests

- Positive: an authenticated admin can open the analytics dashboard and view summary metrics.
- Positive: an authenticated admin can see the top clicked offer, top 5 offers, and activity chart.
- Positive: an authenticated admin can inspect funnel metrics derived from the recommendation flow.
- Negative: an unauthenticated user cannot access the analytics dashboard.
- Edge: the dashboard renders a safe empty state when there is little or no data.

## Acceptance Criteria

- [ ] A protected admin analytics dashboard exists.
- [ ] Total conversations are displayed.
- [ ] Recommendation generation rate is displayed.
- [ ] Total clicks are displayed.
- [ ] Top clicked offer is displayed.
- [ ] Top 5 offers by clicks are displayed.
- [ ] CTR per offer is displayed using a deterministic documented calculation.
- [ ] Total conversations, recommendation generation rate, funnel stages, and CTR use deterministic documented definitions.
- [ ] A funnel chart or funnel-style summary exists for the core recommendation journey.
- [ ] A last 30 days activity chart or equivalent time-series view exists.
- [ ] The dashboard uses the persisted analytics and click/conversation data defined in SPEC-02.
- [ ] The spec preserves the separation between the lightweight MVP analytics foundation and this later dashboard expansion.
- [ ] Analytics routes and APIs are protected by the admin auth flow from SPEC-06.
- [ ] Empty-state and low-volume dashboards render safely.
- [ ] Unit, integration, and E2E tests cover summary metrics, offer metrics, auth behavior, and low-data behavior.

## Sprint Tasks

1. Define the protected analytics routes and API contracts.
2. Define deterministic formulas for total conversations, recommendation generation rate, funnel stages, and CTR.
3. Document the separation between the lightweight MVP analytics foundation and this later dashboard expansion.
4. Implement summary aggregation for conversations, recommendation generation, clicks, and top clicked offer.
5. Implement offer-level aggregation for top 5 offers by clicks and CTR per offer.
6. Implement the funnel view using the documented deterministic stage definitions.
7. Implement the last 30 days activity time series.
8. Add safe empty-state handling for low-volume datasets.
9. Verify auth protection for all analytics pages and APIs.
10. Add unit, integration, and E2E coverage for summary metrics, offer metrics, funnel behavior, and low-data behavior.
