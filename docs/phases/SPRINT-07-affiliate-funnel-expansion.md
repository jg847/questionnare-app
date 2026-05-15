# Sprint 07: Affiliate Funnel Expansion

## Goal

Expand ToolMatch AI from a working recommendation app into a more complete affiliate acquisition and monetization platform aligned with the Full-Stack / AI Engineer application target.

## Linked Specs

- [docs/_spec/SPEC-11-questionnaire-builder-and-branching.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-11-questionnaire-builder-and-branching.md)
- [docs/_spec/SPEC-12-seo-content-and-compliance-pages.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-12-seo-content-and-compliance-pages.md)
- [docs/_spec/SPEC-13-conversion-and-revenue-tracking.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-13-conversion-and-revenue-tracking.md)

## Dependencies

- Sprints 01 through 06 complete
- Public chat and recommendation flow working end-to-end
- Affiliate click tracking, admin auth, admin offer management, and analytics foundations already validated

## Scope

- Configurable questionnaire builder with branching logic and structured answer persistence
- Public questionnaire runtime that can feed recommendation context
- SEO-friendly landing, category, FAQ, and comparison page templates
- Public compliance surface including privacy, terms, and affiliate disclosure templates
- Conversion and revenue ingestion, attribution, and admin reporting

## Deliverables

- Questionnaire definition model and admin questionnaire builder
- Public branching questionnaire flow with analytics and recommendation handoff
- SEO metadata support, sitemap, robots, and content-page templates
- Privacy policy, terms, cookie/privacy disclosure, and affiliate disclosure pages
- Conversion and revenue persistence plus protected admin reporting
- Offer-level monetization metrics including conversion rate and EPC

## Tasks

1. Implement the configurable questionnaire system from SPEC-11.
2. Define questionnaire entities, typed questions, option contracts, branch rules, validation, submissions, and persisted answers.
3. Implement admin questionnaire list, create, edit, validate, preview, and activation flows with single-active-questionnaire enforcement.
4. Implement the public questionnaire runtime with branching behavior, progress persistence, and recommendation-context mapping.
5. Emit questionnaire lifecycle analytics events for start, answer, completion, and abandonment.
6. Implement the public SEO and content surface from SPEC-12.
7. Add category landing pages, reusable content templates, metadata generation, sitemap support, and robots policy.
8. Add privacy, terms, affiliate disclosure, and cookie/privacy disclosure templates with footer navigation.
9. Ensure content and compliance pages provide clear entry points into the questionnaire or recommendation flow.
10. Implement conversion and revenue tracking from SPEC-13.
11. Define partner and conversion persistence, deterministic attribution by `sub_id` or related identifiers, and unmatched-conversion handling.
12. Add at least one first-version ingestion path for conversions such as manual admin entry, CSV import, or mocked partner callback.
13. Implement protected revenue reporting for conversions, attributed revenue, conversion rate, EPC, and offer-level monetization.
14. Verify that questionnaire, SEO/content, and monetization enhancements remain additive and do not regress the working chat and click-tracking flow.

## Validation

- Admins can create, validate, preview, and activate a branching questionnaire without code changes.
- Users can complete a public questionnaire and reach ranked recommendations using structured answer data.
- Public landing and category pages render crawlable metadata and link into the recommendation flow.
- Privacy, terms, and affiliate disclosure pages are present and reachable from the public site.
- Conversion and revenue records can be ingested and attributed back to tracked clicks deterministically when identifiers exist.
- Revenue reporting exposes conversions, attributed revenue, conversion rate, and EPC with safe empty states.
- All new admin routes remain protected by admin authentication.

## Exit Criteria

- ToolMatch AI demonstrates a configurable quiz funnel, a public affiliate-site surface, and monetization reporting beyond raw click volume.
- SPEC-11, SPEC-12, and SPEC-13 are implemented without reopening the earlier MVP scope or destabilizing validated post-MVP functionality.

## Out of Scope

- Full CMS adoption
- Multi-network production-grade affiliate integrations across every platform
- Advanced attribution, CRO experimentation frameworks, or large-scale programmatic SEO