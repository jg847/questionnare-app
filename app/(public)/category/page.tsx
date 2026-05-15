import Link from 'next/link';
import type { Metadata } from 'next';

import { PublicSiteShell } from '@/components/public/public-site-shell';
import {
  buildBreadcrumbSchema,
  buildMetadata,
  buildPageUrl,
  categoryPages,
} from '@/lib/content/site-content';

export const metadata: Metadata = buildMetadata({
  title: 'Software Categories | ToolMatch AI',
  description: 'Browse software categories, get quick buyer context, and move into the quiz or chat when you are ready to narrow your shortlist.',
  pathname: '/category',
});

export default function CategoryIndexPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: buildPageUrl('/') },
    { name: 'Categories', url: buildPageUrl('/category') },
  ]);

  return (
    <PublicSiteShell
      eyebrow="Category library"
      intro="Use category pages when you want quick market context before narrowing into a shortlist. Once you know the category, move into the quiz or chat instead of staying in research mode."
      title="Browse software categories in one place"
    >
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} type="application/ld+json" />

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">All categories</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Pick a category, then move into a decision path</h2>
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
          {categoryPages.map((category) => (
            <article className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={category.slug}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{category.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{category.intro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href={`/category/${category.slug}`}>
                  Read overview
                </Link>
                <Link className="text-sm font-medium text-foreground underline-offset-4 hover:underline" href={`/quiz?category=${category.slug}`}>
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