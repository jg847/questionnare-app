import type { Metadata } from 'next';

import { PublicSiteShell } from '@/components/public/public-site-shell';
import { buildMetadata, getCompliancePage } from '@/lib/content/site-content';

const page = getCompliancePage('affiliate-disclosure')!;

export const metadata: Metadata = buildMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  pathname: '/affiliate-disclosure',
});

export default function AffiliateDisclosurePage() {
  return (
    <PublicSiteShell eyebrow="Compliance template" intro={page.intro} title={page.title}>
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
        <div className="space-y-6">
          {page.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-2xl font-semibold text-foreground">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}