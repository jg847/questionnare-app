import type { Metadata } from 'next';

import { PublicSiteShell } from '@/components/public/public-site-shell';
import {
  buildFaqSchema,
  buildMetadata,
  siteFaqItems,
} from '@/lib/content/site-content';

export const metadata: Metadata = buildMetadata({
  title: 'FAQ | ToolMatch AI',
  description: 'Answers to common questions about ToolMatch AI, the guided questionnaire, and affiliate recommendation links.',
  pathname: '/faq',
});

export default function FaqPage() {
  const faqSchema = buildFaqSchema(siteFaqItems);

  return (
    <PublicSiteShell
      eyebrow="Buyer support content"
      intro="This page keeps the buyer-support questions in one place so the homepage can stay focused on getting visitors into the right recommendation path."
      title="Frequently asked questions"
    >
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} type="application/ld+json" />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <div className="grid gap-4">
            {siteFaqItems.map((faq) => (
              <div className="rounded-[1.25rem] bg-[#faf6ee] p-5" key={faq.question}>
                <h2 className="text-xl font-semibold text-foreground">{faq.question}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-border bg-[#fffaf0] p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Need a next step?</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">Don’t stay in support content longer than necessary</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">If your question is answered, move back into the decision flow that fits you best.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" href="/quiz">
              Start the quiz
            </a>
            <a className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-white" href="/#chat">
              Open chat
            </a>
          </div>
        </aside>
      </section>
    </PublicSiteShell>
  );
}