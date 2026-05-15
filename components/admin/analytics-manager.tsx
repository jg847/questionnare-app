'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AdminAnalyticsResponse } from '@/types/admin';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDateInput(value: string) {
  return value.slice(0, 10);
}

export function AnalyticsManager() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAnalytics = useCallback(async (nextFrom?: string, nextTo?: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams();
      if (nextFrom) {
        params.set('from', nextFrom);
      }
      if (nextTo) {
        params.set('to', nextTo);
      }

      const response = await fetch(`/api/admin/analytics?${params.toString()}`);
      const payload = (await response.json()) as AdminAnalyticsResponse & { error?: string };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error || 'Failed to load analytics.');
      }

      setAnalytics(payload);
      setFrom(formatDateInput(payload.window.from));
      setTo(formatDateInput(payload.window.to));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const maxActivity = useMemo(() => {
    if (!analytics?.activity.length) {
      return 0;
    }

    return analytics.activity.reduce((max, point) => {
      return Math.max(max, point.conversations, point.recommendationsGenerated, point.clicks);
    }, 0);
  }, [analytics]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe3_0%,#fcfaf5_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Protected Admin</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground">Analytics Dashboard</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                Deterministic operational analytics built on the lightweight MVP tracking foundation: conversations, recommendation generation, clicks, funnel stage counts, and last-30-days activity.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin">Offers</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=questionnaires">Questionnaires</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=prompts">Prompts</a>
                <span className="rounded-full bg-secondary px-4 py-2 text-secondary-foreground">Analytics</span>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=revenue">Revenue</a>
              </div>
            </div>

            <form action="/api/admin/logout" method="post">
              <button className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Date window</h2>
              <p className="mt-1 text-sm text-muted-foreground">Default is the last 30 days. All metrics use deterministic formulas documented in the API response.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-foreground">
                From
                <input className="mt-2 h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
              </label>
              <label className="text-sm font-medium text-foreground">
                To
                <input className="mt-2 h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setTo(event.target.value)} type="date" value={to} />
              </label>
              <button className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" onClick={() => void loadAnalytics(from, to)} type="button">
                Refresh analytics
              </button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm text-[#7d3d2f]">{errorMessage}</div>
        ) : null}

        {isLoading || !analytics ? (
          <div className="rounded-[2rem] border border-border bg-white p-6 text-sm text-muted-foreground shadow-[0_18px_60px_rgba(67,47,31,0.08)]">Loading analytics...</div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <p className="text-sm text-muted-foreground">Total conversations</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{analytics.summary.totalConversations}</p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <p className="text-sm text-muted-foreground">Recommendation generation rate</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{formatPercent(analytics.summary.recommendationGenerationRate)}</p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <p className="text-sm text-muted-foreground">Total clicks</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{analytics.summary.totalClicks}</p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <p className="text-sm text-muted-foreground">Top clicked offer</p>
                <p className="mt-3 text-xl font-semibold text-foreground">{analytics.summary.topClickedOffer?.name ?? 'No clicks yet'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{analytics.summary.topClickedOffer ? `${analytics.summary.topClickedOffer.clicks} clicks` : 'Low-volume safe state'}</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Funnel</h2>
                <p className="mt-1 text-sm text-muted-foreground">Conversations started, conversations with recommendations, and sessions with at least one click.</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.25rem] bg-[#faf6ee] p-4">
                    <p className="text-sm text-muted-foreground">Conversations started</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{analytics.summary.funnel.conversationsStarted}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[#f3f8f5] p-4">
                    <p className="text-sm text-muted-foreground">Recommendations generated</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{analytics.summary.funnel.recommendationsGenerated}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[#f4f1fb] p-4">
                    <p className="text-sm text-muted-foreground">Sessions with recommendation click</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{analytics.summary.funnel.recommendationClicks}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Top offers by clicks</h2>
                <p className="mt-1 text-sm text-muted-foreground">The five most-clicked offers in the selected window, sorted deterministically by clicks and then name.</p>
                {analytics.topOffersByClicks.length === 0 ? (
                  <p className="mt-5 rounded-[1.25rem] bg-[#faf6ee] p-4 text-sm text-muted-foreground">No offer-level analytics yet for this window.</p>
                ) : (
                  <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-border/80">
                    <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                      <thead className="bg-[#faf6ee] text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Offer</th>
                          <th className="px-4 py-3 font-medium">Clicks</th>
                          <th className="px-4 py-3 font-medium">Recommendations</th>
                          <th className="px-4 py-3 font-medium">CTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/70 bg-white">
                        {analytics.topOffersByClicks.map((offer) => (
                          <tr key={offer.offer_id}>
                            <td className="px-4 py-3 text-foreground">{offer.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{offer.clicks}</td>
                            <td className="px-4 py-3 text-muted-foreground">{offer.recommendations}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatPercent(offer.ctr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <h2 className="text-2xl font-semibold text-foreground">CTR per offer</h2>
              <p className="mt-1 text-sm text-muted-foreground">CTR is defined as clicks for the offer divided by recommendations for the offer in the selected window.</p>
              {analytics.offers.length === 0 ? (
                <p className="mt-5 rounded-[1.25rem] bg-[#faf6ee] p-4 text-sm text-muted-foreground">No offer-level analytics yet for this window.</p>
              ) : (
                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-border/80">
                  <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                    <thead className="bg-[#faf6ee] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Offer</th>
                        <th className="px-4 py-3 font-medium">Clicks</th>
                        <th className="px-4 py-3 font-medium">Recommendations</th>
                        <th className="px-4 py-3 font-medium">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70 bg-white">
                      {analytics.offers.map((offer) => (
                        <tr key={offer.offer_id}>
                          <td className="px-4 py-3 text-foreground">{offer.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{offer.clicks}</td>
                          <td className="px-4 py-3 text-muted-foreground">{offer.recommendations}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatPercent(offer.ctr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <h2 className="text-2xl font-semibold text-foreground">Last 30 days activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">Low-volume safe time series for conversations, generated recommendations, and clicks.</p>
              <div className="mt-6 space-y-3">
                {analytics.activity.map((point) => {
                  const scale = maxActivity > 0 ? Math.max(point.conversations, point.recommendationsGenerated, point.clicks) / maxActivity : 0;
                  return (
                    <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-4" key={point.date}>
                      <p className="text-sm text-muted-foreground">{point.date}</p>
                      <div className="h-3 overflow-hidden rounded-full bg-[#f1ebdf]">
                        <div className="h-full rounded-full bg-[#b98952]" style={{ width: `${Math.max(scale * 100, 2)}%` }} />
                      </div>
                      <p className="text-sm text-foreground">C {point.conversations} · R {point.recommendationsGenerated} · K {point.clicks}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}