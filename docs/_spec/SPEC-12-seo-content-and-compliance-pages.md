# Spec: SEO, Content, and Compliance Pages

**ID:** SPEC-12  
**Status:** Draft  
**Sprint:** 7

## Summary

This spec defines the search, content, and compliance surface required to make ToolMatch AI look and behave like a niche affiliate recommendation site rather than only an application shell. It covers SEO-friendly landing pages, category and comparison content structures, metadata, internal linking, privacy and disclosure pages, and compliance-ready templates suitable for affiliate-driven acquisition.

## User Stories

- As a visitor, I want clear landing pages and supporting content so that I understand what the site does before engaging the questionnaire or chat flow.
- As a search engine, I want stable metadata, structured content, and crawlable pages so that the site can rank for relevant intent.
- As a product owner, I want disclosure and policy pages in place so that the site is safer to deploy as an affiliate property.

## MVP Scope

### Must Exist for This Spec

- A landing-page framework for niche and category pages
- SEO metadata for public pages including titles, descriptions, canonical URLs, and Open Graph basics
- Content page templates for category pages, comparison pages, and FAQ-style support content
- Compliance-ready templates for privacy policy, terms, affiliate disclosure, and cookie/privacy disclosure as needed
- Public result pages or shareable recommendation summary pages where appropriate
- Sitemap and robots support suitable for a deployable public site
- Internal linking structure that connects landing pages, content pages, and interactive recommendation entry points

### Can Be Stubbed or Deferred

- Full editorial CMS workflows
- Programmatic SEO at large scale across hundreds of pages
- Automated content generation pipelines
- Full legal review for regulated verticals beyond template readiness
- Advanced multilingual SEO
- Blog infrastructure or newsletter publishing systems

### Assumptions

- The current app already has a usable public homepage and recommendation flow.
- This spec is post-MVP and expands the project into a stronger affiliate-site presentation for hiring and deployment readiness.
- Offer and category data already exist and can be reused for public content surfaces.
- The project may later support multiple niches, but this first version can stay focused on software-tool discovery.

## Functional Requirements

1. Implement SEO-friendly public page templates beyond the homepage.
2. Support category landing pages for core supported recommendation categories.
3. Support comparison or buyer-guide page templates for curated offer sets.
4. Support FAQ or supporting content sections that answer common buyer questions.
5. Every public content page must support unique metadata including title, description, canonical URL, and social preview fields.
6. The site must generate or expose a sitemap suitable for search crawling.
7. The site must expose a robots policy suitable for a public deployable site.
8. Public pages must include clear internal navigation to the questionnaire or recommendation entry path.
9. The site must provide an affiliate disclosure page template and surface affiliate disclosure near recommendation and CTA experiences.
10. The site must provide privacy policy and terms page templates.
11. The site must provide a cookie/privacy disclosure structure when analytics or tracking require it.
12. Compliance pages must be accessible from the site footer and other standard public navigation surfaces.
13. Landing pages must be crawlable server-rendered or statically rendered routes rather than client-only shells.
14. Public pages must support structured headings and readable semantic content rather than empty layout scaffolds.
15. If result pages are made public or shareable, they must avoid exposing private user data and must handle noindex decisions explicitly.
16. The content system must support reusable templates so new category or niche pages can be added consistently.
17. SEO page rendering must remain compatible with Next.js App Router metadata APIs or equivalent framework-native primitives.
18. Public pages must include a clear recommendation-entry CTA such as start quiz, answer questionnaire, or talk to Arlo.
19. The public content surface must support niche-specific positioning copy that explains how recommendations are generated.
20. The system must support schema markup where practical for organization, FAQ, and breadcrumb-level enhancement.
21. Compliance pages must be templates and disclaimers only, not legal advice.
22. The content surface must not weaken page performance materially through unnecessary client-side rendering.

## Non-Functional Requirements

- Favor crawlable server-rendered or statically rendered content.
- Keep the first version template-driven rather than CMS-heavy.
- Use metadata and structured content that are explicit and easy to inspect.
- Do not over-engineer programmatic SEO before the site has proven content patterns.
- Make compliance surfaces look production-ready even if they remain template-based.

## Data Model

This feature can start with file-based or config-driven content definitions, but should be able to evolve toward CMS-backed content later.

Suggested early entities or content structures:

- `content_pages`
- `content_page_sections`
- `seo_metadata`
- `compliance_pages`

Suggested fields:

- `slug`
- `page_type`
- `title`
- `meta_title`
- `meta_description`
- `canonical_url`
- `og_title`
- `og_description`
- `intro_copy`
- `faq_items`
- `category`
- `is_indexable`

This spec may initially be implemented with local content configuration if that keeps the first version faster and simpler.

## API Contract

No public JSON API is strictly required for the first version if content is rendered directly through route modules.

Suggested optional internal contracts:

- `GET /api/content/pages/:slug`
- `GET /api/content/categories/:category`

Suggested content page shape:

```ts
type ContentPage = {
  slug: string;
  page_type: 'landing' | 'category' | 'comparison' | 'faq' | 'compliance';
  title: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  is_indexable: boolean;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  faq_items?: Array<{
    question: string;
    answer: string;
  }>;
};
```

Behavior requirements:

- public routes must render usable metadata server-side
- compliance pages must be routable from standard navigation
- page templates must support category-specific content without code duplication across every page

## UI/UX Notes

- The public site should feel like an intentional affiliate recommendation property, not only a demo app.
- Content pages should guide users toward action rather than read like generic placeholder documents.
- Compliance pages should be easy to find but not distract from the primary conversion flow.
- SEO pages should preserve the existing product tone while broadening trust and discoverability.
- The footer should provide standard public-site affordances: privacy, terms, disclosure, and key category links.

## Design Patterns

- **Template Method:** page templates should standardize layout and metadata while allowing category-specific content blocks.
- **Configuration over Code:** early content definitions can live in typed config or content modules rather than a heavy CMS.
- **Composition:** landing pages, FAQ sections, disclosures, and CTAs should be reusable public components.
- **Dependency Inversion:** public rendering should depend on typed content contracts rather than hard-coded strings spread across routes.

## Test Cases

### Unit Tests

- Positive: page metadata is generated correctly for representative page types.
- Positive: compliance pages resolve the expected titles and disclosure content blocks.
- Negative: non-indexable pages are marked appropriately.
- Edge: missing optional FAQ or comparison sections still render safely.

### Integration Tests

- Positive: public category pages render server-side with correct metadata.
- Positive: sitemap and robots routes return valid responses.
- Positive: footer navigation links to privacy, terms, and disclosure pages.
- Negative: unknown content slugs return safe not-found behavior.
- Edge: shareable result pages apply the correct indexability rules.

### E2E Tests

- Positive: a visitor can land on a category page and enter the recommendation flow.
- Positive: privacy, terms, and affiliate disclosure pages are reachable from the public site.
- Positive: category pages expose the expected headings and CTAs.
- Negative: unknown public content routes render not-found safely.
- Edge: metadata and canonical behavior remain stable across key page templates.

## Acceptance Criteria

- [ ] SEO-friendly public templates exist for landing and category-style pages.
- [ ] Public pages expose server-rendered metadata including title, description, and canonical URL.
- [ ] Sitemap and robots support exist.
- [ ] Privacy policy, terms, and affiliate disclosure templates exist and are linked from the public site.
- [ ] Public content pages provide clear entry points into the recommendation flow.
- [ ] Content templates support reusable category-specific sections without excessive duplication.
- [ ] Structured schema markup exists where practical for FAQ, breadcrumb, and organization-level enhancement.
- [ ] Structured content and internal linking improve the site’s public discoverability and trust surface.
- [ ] Unit, integration, and E2E coverage exist for metadata, routing, compliance pages, and public entry CTAs.

## Sprint Tasks

1. Define the public content surface and page-template inventory.
2. Implement category landing pages and reusable content page templates.
3. Implement metadata generation, sitemap support, and robots policy.
4. Implement privacy, terms, affiliate disclosure, and cookie/privacy disclosure templates.
5. Add footer and public-site navigation for compliance and content discovery.
6. Add structured schema markup where practical for FAQ, breadcrumb, and organization-level enhancement.
7. Verify page rendering remains SEO-friendly and performance-safe.
8. Add unit, integration, and E2E coverage for metadata, routing, compliance pages, and CTA entry points.