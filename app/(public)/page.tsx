import Link from 'next/link';
import type { Metadata } from 'next';

import { ChatExperience } from '@/components/chat/chat-experience';
import { PublicSiteShell } from '@/components/public/public-site-shell';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildMetadata,
  buildOrganizationSchema,
  buildPageUrl,
  featuredCategories,
  siteFaqItems,
} from '@/lib/content/site-content';

export const metadata: Metadata = buildMetadata({
  title: 'ToolMatch AI | Guided Software Recommendations',
  description: 'Find software faster with a branching questionnaire, AI-assisted chat, and trust-oriented public content pages built for affiliate discovery.',
  pathname: '/',
});

export default function HomePage() {
  const featuredComparisons = [
    {
      href: '/compare/hubspot-vs-pipedrive',
      title: 'HubSpot vs Pipedrive',
      description: 'For teams deciding between a broader growth platform and a more focused sales CRM.',
    },
    {
      href: '/compare/asana-vs-clickup',
      title: 'Asana vs ClickUp',
      description: 'For buyers balancing workflow clarity against flexibility and workspace breadth.',
    },
    {
      href: '/compare/zendesk-vs-freshdesk',
      title: 'Zendesk vs Freshdesk',
      description: 'For support teams weighing maturity, cost, and operational complexity.',
    },
  ];

  const organizationSchema = buildOrganizationSchema();
  const faqSchema = buildFaqSchema(siteFaqItems);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: buildPageUrl('/') },
  ]);

  return (
    <PublicSiteShell
      eyebrow="AI-guided software discovery"
      intro="Start with the shortest path to a useful shortlist. The homepage now keeps the quiz, chat, and core category entry points up front, while the supporting pages handle deeper reading."
      title="Get to the right software shortlist without digging through crowded listicles"
    >
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
        type="application/ld+json"
      />

      <section>
        <div className="rounded-[2rem] border border-border bg-[#fffaf0] p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Start here</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">Pick the fastest path to a shortlist</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">The homepage is centered on the two decision paths that matter most: the guided quiz for structured qualification and chat for open-ended needs.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" href="/quiz">
              Start the Quiz
            </Link>
            <a className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary" href="/#chat">
              Talk to Arlo
            </a>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">1</p>
              <p className="mt-2 font-medium text-foreground">Choose a path</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Quiz if you want guided narrowing, chat if you already know the shape of the problem.</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">2</p>
              <p className="mt-2 font-medium text-foreground">Capture your constraints</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Use case, priorities, team size, and budget drive the ranking instead of generic popularity.</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">3</p>
              <p className="mt-2 font-medium text-foreground">Act on a shortlist</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Move to the most relevant offer pages with clear disclosures and less comparison-page noise.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Browse categories</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Use a category page only when you need a little more context first</h2>
          </div>
          <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href="/faq">
            Read the buyer FAQ
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredCategories.slice(0, 4).map((category) => (
            <article className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={category.href}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{category.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{category.description}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href={category.href}>
                  Read overview
                </Link>
                <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href={category.quizHref}>
                  {category.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Popular comparisons</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Start from a known head-to-head when that is how you are already searching</h2>
          </div>
          <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href="/compare">
            Browse all comparisons
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featuredComparisons.map((comparison) => (
            <article className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={comparison.href}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comparison</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{comparison.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{comparison.description}</p>
              <Link className="mt-4 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline" href={comparison.href}>
                Read comparison
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-4 shadow-[0_18px_60px_rgba(67,47,31,0.08)]" id="chat">
        <ChatExperience embedded />
      </section>
    </PublicSiteShell>
  );
}
