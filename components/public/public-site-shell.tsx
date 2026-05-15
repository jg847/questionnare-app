import Link from 'next/link';

import { footerLinks } from '@/lib/content/site-content';

import { PublicSiteHeader } from '@/components/public/public-site-header';

export function PublicSiteShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#efe3c6_0%,#f8f3e7_22%,#fcfaf5_48%,#ffffff_100%)] text-foreground">
      <PublicSiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-[2rem] border border-border/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(67,47,31,0.08)] md:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-serif text-4xl font-semibold text-foreground md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{intro}</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#faf4e7] p-5 text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">Best for buyers who need less browsing and faster narrowing.</p>
              <p className="mt-2">Use the quiz for structure, keep chat for edge cases, and use category pages only when you want more context first.</p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-8">{children}</div>
      </div>

      <footer className="border-t border-border/80 bg-white/85">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">ToolMatch AI</p>
            <p className="mt-1 text-sm text-muted-foreground">Guided software discovery with buyer-focused content, clear disclosures, and tracked recommendation flows.</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm">
            {footerLinks.map((link) => (
              <Link className="rounded-full border border-border px-4 py-2 transition-colors hover:bg-secondary" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}