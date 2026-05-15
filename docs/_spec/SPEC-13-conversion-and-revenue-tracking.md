# Spec: Conversion and Revenue Tracking

**ID:** SPEC-13  
**Status:** Draft  
**Sprint:** 7

## Summary

This spec defines the post-click measurement layer for ToolMatch AI. It expands the current outbound affiliate click tracking into conversion and revenue tracking, partner attribution, revenue reporting, and admin analytics suitable for operating an affiliate recommendation site with more meaningful business metrics than click volume alone.

## User Stories

- As a product owner, I want to measure conversions and attributed revenue so that I can evaluate which questionnaires, offers, and landing pages actually monetize.
- As an admin, I want partner- and offer-level revenue reporting so that I can decide where to optimize content and recommendation logic.
- As a developer, I want a deterministic attribution contract so that click, conversion, and revenue reporting stay coherent.

## MVP Scope

### Must Exist for This Spec

- A persisted conversion record model linked back to tracked outbound clicks where possible
- Revenue event support with deterministic attribution rules
- Admin reporting for conversions, conversion rate, revenue, EPC, and revenue by offer or partner
- Support for manual import, webhook ingestion, or simulated partner conversion ingestion in the first version
- Offer and partner metadata sufficient to interpret commissions and payouts
- Deterministic click-to-conversion attribution based on SubID, click record, and partner identifiers

### Can Be Stubbed or Deferred

- Full live integration with every affiliate network listed in the job posting
- Multi-touch attribution or probabilistic attribution
- Automated reconciliation against partner dashboards
- Refund and clawback processing beyond a basic status model
- Revenue forecasting and cohort analysis
- Finance-grade accounting exports

### Assumptions

- Outbound click tracking already exists from [docs/_spec/SPEC-05-affiliate-tracking.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-05-affiliate-tracking.md).
- The job-aligned value of this feature is demonstrating business instrumentation maturity rather than full network integration breadth.
- The first version can use one or more ingestion methods such as manual admin entry, CSV import, mocked partner callback, or a minimal webhook endpoint.
- Admin analytics foundations already exist from [docs/_spec/SPEC-09-analytics-dashboard.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-09-analytics-dashboard.md).

## Functional Requirements

1. Implement a conversion and revenue data model linked to offers and, where possible, click records.
2. Each conversion record must support a status model such as pending, approved, rejected, and paid.
3. Each conversion record must support partner-level identifiers where available.
4. The system must support deterministic attribution from a conversion event back to a prior click using `sub_id`, click identifiers, partner click references, or equivalent deterministic identifiers.
5. Revenue amounts must be stored as explicit numeric values with a currency field.
6. The system must support partner or offer metadata that identifies commission model details when needed for interpretation.
7. Support at least one first-version ingestion path for conversion events, such as manual admin entry, CSV import, mocked partner callback, or webhook ingestion.
8. Conversion ingestion must validate incoming records and reject malformed or duplicate payloads safely.
9. The system must preserve unmatched conversion records with an explicit attribution state rather than silently discarding them.
10. Admin reporting must expose total conversions, approved conversions, total attributed revenue, conversion rate, and EPC.
11. Admin reporting must support offer-level revenue and conversion summaries.
12. Admin reporting should support partner-level summaries when partner metadata exists.
13. The system must compute conversion rate deterministically as `approved matched conversions / tracked clicks` for the selected scope.
14. The system must compute EPC deterministically as `approved attributed revenue / tracked clicks` for the selected scope.
15. Revenue dashboards must support a selected date range.
16. The system must emit analytics events such as `conversion_recorded`, `conversion_approved`, and `revenue_recorded` when appropriate.
17. The system must preserve compatibility with the current click-tracking and analytics foundations.
18. Revenue and conversion routes and admin pages must be protected by admin authentication.
19. The reporting layer must safely handle low-volume, zero-volume, and unmatched-conversion states.
20. The system must support updating conversion status over time without losing the original partner payload or imported source data.
21. The system must retain source metadata sufficient for debugging attribution mismatches.
22. The first version must not require live integration with every affiliate platform to be useful for demonstration and testing.

## Non-Functional Requirements

- Prefer deterministic and explainable attribution over ambiguous matching heuristics.
- Keep the first version integration-light and operationally testable.
- Preserve raw-source metadata so attribution issues are debuggable.
- Avoid making revenue tracking depend on any single affiliate network integration.
- Make low-volume monetization reporting understandable and stable.

## Data Model

Suggested new entities:

- `partners`
- `conversions`
- optional `partner_conversion_imports`

Suggested fields:

- `partners.id`
- `partners.name`
- `partners.network`
- `partners.default_currency`
- `partners.commission_model`
- `conversions.id`
- `conversions.partner_id`
- `conversions.offer_id`
- `conversions.click_id`
- `conversions.sub_id`
- `conversions.partner_conversion_id`
- `conversions.status`
- `conversions.conversion_value`
- `conversions.commission_value`
- `conversions.currency`
- `conversions.occurred_at`
- `conversions.recorded_at`
- `conversions.source_payload`
- `conversions.attribution_state`

Suggested attribution states:

- `matched`
- `unmatched`
- `manual_match`
- `duplicate_rejected`

## API Contract

Suggested protected admin endpoints:

- `GET /api/admin/conversions`
- `POST /api/admin/conversions`
- `PATCH /api/admin/conversions/:id`
- `GET /api/admin/revenue/summary`
- `GET /api/admin/revenue/offers`
- `GET /api/admin/revenue/partners`

Suggested optional partner ingestion endpoint:

- `POST /api/partners/conversions/:partnerKey`

Suggested conversion shape:

```ts
type ConversionRecord = {
  id: string;
  partner_id?: string;
  offer_id?: string;
  click_id?: string;
  sub_id?: string;
  partner_conversion_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  conversion_value?: number;
  commission_value: number;
  currency: string;
  occurred_at: string;
  attribution_state: 'matched' | 'unmatched' | 'manual_match' | 'duplicate_rejected';
};
```

Suggested summary response shape:

```ts
type RevenueSummary = {
  totalClicks: number;
  totalConversions: number;
  approvedConversions: number;
  conversionRate: number;
  attributedRevenue: number;
  epc: number;
  currency: string;
  metricDefinitions: {
    totalConversions: 'count(all conversion records in window excluding duplicate_rejected)';
    approvedConversions: 'count(conversions where status in approved or paid and attribution_state = matched in window)';
    conversionRate: 'approved matched conversions / tracked clicks in window';
    epc: 'approved attributed revenue / tracked clicks in window';
  };
};
```

Behavior requirements:

- admin routes must require admin auth
- duplicate partner conversion identifiers must be rejected or safely deduplicated
- unmatched conversions must remain visible for investigation
- summary formulas must be deterministic and documented in the implementation contract

Reporting definitions:

- `totalConversions` counts all persisted conversion records in the selected window except records explicitly marked `duplicate_rejected`
- `approvedConversions` counts only records with status `approved` or `paid` and attribution_state `matched`
- `conversionRate` uses `approvedConversions / totalClicks`
- `attributedRevenue` and `epc` use only approved or paid matched conversions

## UI/UX Notes

- Revenue reporting should make monetization performance legible at a glance.
- Unmatched conversions should be visible as an operational problem, not hidden.
- Admin flows should support lightweight manual recording or correction when partner callbacks are imperfect.
- Revenue reporting should complement, not replace, the existing click analytics dashboard.

## Design Patterns

- **Repository:** conversion ingestion, attribution lookup, and revenue aggregation should be encapsulated in dedicated data-access layers.
- **Observer:** click events and conversion events are related but should remain decoupled event streams joined by deterministic identifiers.
- **Strategy:** partner ingestion and normalization should be pluggable by network or import source.
- **Single Responsibility:** ingestion, attribution, and reporting should remain separate concerns.

## Test Cases

### Unit Tests

- Positive: attribution resolves a conversion to the correct click by `sub_id`.
- Positive: conversion rate and EPC formulas use the documented deterministic calculations.
- Negative: malformed or duplicate conversion payloads are rejected safely.
- Edge: unmatched conversions are retained with an explicit attribution state.
- Edge: status transitions from pending to approved or paid update reporting correctly.

### Integration Tests

- Positive: an authenticated admin can create or import conversion records.
- Positive: matched conversions link back to offers and click records.
- Positive: summary reporting returns conversions, revenue, conversion rate, and EPC for a date window.
- Negative: unauthenticated revenue or conversion-admin requests are denied.
- Negative: duplicate partner conversion IDs do not create duplicate revenue records.
- Edge: unmatched conversions remain queryable and visible in admin reporting.

### E2E Tests

- Positive: an admin can view revenue metrics and offer-level monetization reporting.
- Positive: an admin can record or ingest a conversion and see reporting update.
- Positive: unmatched conversions are visible for investigation.
- Negative: protected revenue pages are unavailable to unauthenticated users.
- Edge: low-volume revenue dashboards render safe zero or near-zero states.

## Acceptance Criteria

- [ ] A conversion and revenue data model exists.
- [ ] Conversion records support deterministic attribution back to tracked clicks when identifiers are present.
- [ ] At least one first-version conversion ingestion path exists.
- [ ] Duplicate and malformed conversion payloads are handled safely.
- [ ] Unmatched conversions are preserved and visible.
- [ ] Admin reporting exposes conversions, attributed revenue, conversion rate, and EPC.
- [ ] Offer-level monetization reporting exists.
- [ ] Revenue and conversion routes are protected by admin auth.
- [ ] Analytics events exist for recorded conversion or revenue milestones.
- [ ] Unit, integration, and E2E coverage exist for ingestion, attribution, formulas, auth, and low-volume behavior.

## Sprint Tasks

1. Define partner, conversion, and attribution data contracts.
2. Implement conversion persistence and source-payload retention.
3. Implement deterministic click-to-conversion attribution using `sub_id` and related identifiers.
4. Implement at least one first-version ingestion flow for conversions.
5. Implement admin revenue and conversion summary reporting including conversion rate and EPC.
6. Implement offer-level and optional partner-level monetization reporting.
7. Surface unmatched conversions for investigation and correction.
8. Protect all revenue and conversion routes with admin auth.
9. Add unit, integration, and E2E coverage for ingestion, attribution, formulas, unmatched states, and reporting.