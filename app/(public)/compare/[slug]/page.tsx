import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicSiteShell } from '@/components/public/public-site-shell';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildMetadata,
  buildPageUrl,
  comparisonPages,
  getComparisonPage,
} from '@/lib/content/site-content';

export function generateStaticParams() {
  return comparisonPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getComparisonPage(params.slug);

  if (!page) {
    return {};
  }

  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    pathname: `/compare/${page.slug}`,
  });
}

export default function ComparisonPage({ params }: { params: { slug: string } }) {
  const page = getComparisonPage(params.slug);

  if (!page) {
    notFound();
  }

  const faqSchema = buildFaqSchema(page.faqItems);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: buildPageUrl('/') },
    { name: page.title, url: buildPageUrl(`/compare/${page.slug}`) },
  ]);

  return (
    <PublicSiteShell eyebrow="Comparison page" intro={page.intro} title={page.title}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} type="application/ld+json" />

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            {page.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-2xl font-semibold text-foreground">{section.heading}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[1.5rem] bg-[#faf6ee] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Move on quickly</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">Comparison pages should end in a decision path</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Once someone is reading a comparison page, they are close to qualifying themselves. The page should clarify differences, then point them into the quiz or chat.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" href="/quiz">Start the quiz</Link>
              <Link className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-white" href="/#chat">Open chat</Link>
            </div>
            <div className="mt-6 rounded-[1.25rem] bg-white p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">Top reader question</p>
              <p className="mt-1">{page.faqItems[0]?.question}</p>
              <p className="mt-2">{page.faqItems[0]?.answer}</p>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}