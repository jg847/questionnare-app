import Link from 'next/link';
import type { Metadata } from 'next';

import { PublicSiteShell } from '@/components/public/public-site-shell';
import {
  buildBreadcrumbSchema,
  buildMetadata,
  buildPageUrl,
  comparisonPages,
} from '@/lib/content/site-content';

export const metadata: Metadata = buildMetadata({
  title: 'Software Comparisons | ToolMatch AI',
  description: 'Browse software comparison pages by category and jump into the quiz or chat when you are ready to turn head-to-head research into a shortlist.',
  pathname: '/compare',
});

export default function ComparisonIndexPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: buildPageUrl('/') },
    { name: 'Comparisons', url: buildPageUrl('/compare') },
  ]);

  return (
    <PublicSiteShell
      eyebrow="Comparison library"
      intro="Use this page when you already know the vendor head-to-head you care about. Each comparison page gives quick buying context, then routes you back into the quiz or chat to produce a more specific shortlist."
      title="Browse the comparison pages in one place"
    >
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} type="application/ld+json" />

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">All comparisons</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Pick a head-to-head, then move into a decision path</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" href="/quiz">
              Start the quiz
            </Link>
            <Link className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary" href="/#chat">
              Talk to Arlo
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {comparisonPages.map((comparison) => (
            <article className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={comparison.slug}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comparison</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{comparison.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{comparison.intro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href={`/compare/${comparison.slug}`}>
                  Read comparison
                </Link>
                <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href="/quiz">
                  Start shortlist
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}