import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicSiteShell } from '@/components/public/public-site-shell';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildMetadata,
  buildPageUrl,
  categoryPages,
  getCategoryPage,
} from '@/lib/content/site-content';

export function generateStaticParams() {
  return categoryPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getCategoryPage(params.slug);

  if (!page) {
    return {};
  }

  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    pathname: `/category/${page.slug}`,
  });
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const page = getCategoryPage(params.slug);

  if (!page) {
    notFound();
  }

  const faqSchema = buildFaqSchema(page.faqItems);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: buildPageUrl('/') },
    { name: page.title, url: buildPageUrl(`/category/${page.slug}`) },
  ]);
  const comparisonLinksByCategory: Record<string, { href: string; label: string; description: string }[]> = {
    crm: [
      { href: '/compare/hubspot-vs-pipedrive', label: 'HubSpot vs Pipedrive', description: 'Useful when the team is balancing a broader growth platform against a lighter sales-first CRM.' },
      { href: '/compare/salesforce-vs-hubspot', label: 'Salesforce vs HubSpot', description: 'Useful when complexity, customization, and admin capacity are central to the CRM decision.' },
      { href: '/compare/best-crm-for-small-teams', label: 'Best CRM for Small Teams', description: 'Useful when the shortlist needs to stay grounded in small-team adoption, budget, and rollout speed.' },
    ],
    'project-management': [
      { href: '/compare/asana-vs-clickup', label: 'Asana vs ClickUp', description: 'Useful when the team is deciding between execution clarity and broader workspace flexibility.' },
      { href: '/compare/monday-vs-asana', label: 'Monday.com vs Asana', description: 'Useful when visual customization and configurability need to be weighed against cleaner operating structure.' },
    ],
    support: [
      { href: '/compare/zendesk-vs-freshdesk', label: 'Zendesk vs Freshdesk', description: 'Useful when support maturity, routing depth, and budget discipline are the main tradeoffs.' },
      { href: '/compare/intercom-vs-zendesk', label: 'Intercom vs Zendesk', description: 'Useful when the team is weighing conversational support against a more operations-led help desk model.' },
    ],
    automation: [
      { href: '/compare/zapier-vs-make', label: 'Zapier vs Make', description: 'Useful when the choice is really about quick wins versus more complex workflow control.' },
    ],
    'note-taking': [
      { href: '/compare/notion-vs-obsidian', label: 'Notion vs Obsidian', description: 'Useful when collaboration needs have to be balanced against deeper personal knowledge management.' },
    ],
    'knowledge-base': [
      { href: '/compare/notion-vs-confluence-alternative-guide', label: 'Notion vs Confluence Alternative Guide', description: 'Useful when the team is comparing a collaborative workspace feel against a more traditional documentation platform.' },
      { href: '/compare/notion-vs-obsidian', label: 'Notion vs Obsidian', description: 'Useful when knowledge management could tilt toward shared documentation or a more individual-first note system.' },
    ],
    scheduling: [
      { href: '/compare/calendly-vs-acuity-scheduling', label: 'Calendly vs Acuity Scheduling', description: 'Useful when lightweight meeting booking has to be weighed against a more appointment-centered customer flow.' },
    ],
    design: [
      { href: '/compare/figma-vs-canva-for-teams', label: 'Figma vs Canva for Teams', description: 'Useful when deep product-design workflow and faster team-wide asset creation are both on the table.' },
    ],
  };
  const comparisonLinks = comparisonLinksByCategory[page.slug] ?? [];
  const comparisonSectionTitle = page.slug === 'crm' ? 'Popular CRM comparisons' : 'Popular comparisons in this category';

  return (
    <PublicSiteShell eyebrow="Category page" intro={page.intro} title={page.title}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} type="application/ld+json" />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <h2 className="text-3xl font-semibold text-foreground">What this page should help you decide</h2>
          <div className="mt-5 space-y-5">
            {page.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-xl font-semibold text-foreground">{section.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </div>
          {comparisonLinks.length > 0 ? (
            <div className="mt-8 rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Comparison callouts</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">Useful head-to-head pages for this category</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {comparisonLinks.map((comparison) => (
                  <article className="rounded-[1.25rem] bg-white p-4" key={comparison.href}>
                    <h4 className="text-lg font-semibold text-foreground">{comparison.label}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{comparison.description}</p>
                    <Link className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline" href={comparison.href}>
                      Read comparison
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-border bg-[#fffaf0] p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Best next step</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">Use this page for context, then leave it</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Category pages are support surfaces. Once you understand the category, move into the quiz or chat so the shortlist can reflect your constraints.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" href={`/quiz?category=${page.slug}`}>{page.ctaLabel}</Link>
            <Link className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary" href="/#chat">Talk to Arlo</Link>
          </div>
          <div className="mt-6 rounded-[1.25rem] bg-white p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-medium text-foreground">Quick category questions</p>
            {page.faqItems.slice(0, 2).map((faq) => (
              <div className="mt-3" key={faq.question}>
                <p className="font-medium text-foreground">{faq.question}</p>
                <p className="mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
          {comparisonLinks.length > 0 ? (
            <div className="mt-6 rounded-[1.25rem] bg-white p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">{comparisonSectionTitle}</p>
              <div className="mt-3 flex flex-col gap-2">
                {comparisonLinks.map((comparison) => (
                  <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={comparison.href} key={comparison.href}>
                    {comparison.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-6 text-xs leading-5 text-muted-foreground">Affiliate disclosure: some recommendation links may earn ToolMatch AI a commission.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Decision criteria</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">What usually decides the right fit in this category</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {page.decisionCriteria.map((criterion) => (
              <article className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={criterion.label}>
                <h3 className="text-lg font-semibold text-foreground">{criterion.label}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{criterion.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-[#fffaf0] p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Quick guidance</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.5rem] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Best fit</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{page.bestFitSummary}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Watch out for</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{page.watchOutSummary}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Buyer FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">More questions people ask in this category</h2>
          </div>
          <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href="/quiz">
            Use the quiz instead
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.faqItems.map((faq) => (
            <article className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={faq.question}>
              <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}