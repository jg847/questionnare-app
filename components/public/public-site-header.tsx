import Link from 'next/link';

import { publicNavLinks } from '@/lib/content/site-content';

export function PublicSiteHeader() {
  return (
    <div className="border-b border-border/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">ToolMatch AI</p>
          <p className="mt-1 text-sm text-muted-foreground">Shortlist software faster with a guided quiz and focused chat.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {publicNavLinks.map((link) => (
            <Link className="rounded-full border border-border px-4 py-2 transition-colors hover:bg-secondary" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" href="/quiz">
            Start Quiz
          </Link>
        </nav>
      </div>
    </div>
  );
}