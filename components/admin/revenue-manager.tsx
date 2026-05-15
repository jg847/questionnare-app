'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type {
  AdminPartnerListItem,
  AdminRevenueResponse,
} from '@/types/admin';

type PartnerFormState = {
  name: string;
  slug: string;
  network: string;
  default_currency: string;
  commission_model: string;
};

type ConversionFormState = {
  partner_id: string;
  offer_id: string;
  sub_id: string;
  partner_conversion_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  conversion_value: string;
  commission_value: string;
  currency: string;
  occurred_at: string;
  notes: string;
};

const EMPTY_PARTNER_FORM: PartnerFormState = {
  name: '',
  slug: '',
  network: '',
  default_currency: 'USD',
  commission_model: '',
};

const EMPTY_CONVERSION_FORM: ConversionFormState = {
  partner_id: '',
  offer_id: '',
  sub_id: '',
  partner_conversion_id: '',
  status: 'pending',
  conversion_value: '',
  commission_value: '',
  currency: 'USD',
  occurred_at: new Date().toISOString().slice(0, 16),
  notes: '',
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateInput(value: string) {
  return value.slice(0, 10);
}

export function RevenueManager() {
  const [revenue, setRevenue] = useState<AdminRevenueResponse | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [partnerForm, setPartnerForm] = useState(EMPTY_PARTNER_FORM);
  const [conversionForm, setConversionForm] = useState(EMPTY_CONVERSION_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [isSavingConversion, setIsSavingConversion] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRevenue = useCallback(async (nextFrom?: string, nextTo?: string) => {
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

      const response = await fetch(`/api/admin/revenue/summary?${params.toString()}`);
      const payload = (await response.json()) as AdminRevenueResponse & { error?: string };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error || 'Failed to load revenue analytics.');
      }

      setRevenue(payload);
      setFrom(formatDateInput(payload.window.from));
      setTo(formatDateInput(payload.window.to));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load revenue analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRevenue();
  }, [loadRevenue]);

  async function handlePartnerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPartner(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnerForm),
      });
      const payload = (await response.json()) as { partner?: AdminPartnerListItem; error?: string };

      if (!response.ok || !payload.partner) {
        throw new Error(payload.error || 'Failed to create partner.');
      }

      setPartnerForm(EMPTY_PARTNER_FORM);
      setConversionForm((current) => ({ ...current, partner_id: payload.partner!.id }));
      await loadRevenue(from, to);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create partner.');
    } finally {
      setIsSavingPartner(false);
    }
  }

  async function handleConversionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingConversion(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/conversions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: conversionForm.partner_id || undefined,
          offer_id: conversionForm.offer_id || undefined,
          sub_id: conversionForm.sub_id || undefined,
          partner_conversion_id: conversionForm.partner_conversion_id || undefined,
          status: conversionForm.status,
          conversion_value: conversionForm.conversion_value ? Number(conversionForm.conversion_value) : undefined,
          commission_value: Number(conversionForm.commission_value),
          currency: conversionForm.currency,
          occurred_at: new Date(conversionForm.occurred_at).toISOString(),
          notes: conversionForm.notes || undefined,
        }),
      });
      const payload = (await response.json()) as { conversion?: { id: string }; error?: string };

      if (!response.ok || !payload.conversion) {
        throw new Error(payload.error || 'Failed to create conversion.');
      }

      setConversionForm({
        ...EMPTY_CONVERSION_FORM,
        occurred_at: new Date().toISOString().slice(0, 16),
      });
      await loadRevenue(from, to);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create conversion.');
    } finally {
      setIsSavingConversion(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe3_0%,#fcfaf5_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Protected Admin</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground">Revenue and Conversions</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Manual conversion ingestion, deterministic click attribution via sub-ID, and monetization reporting by offer and partner.</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin">Offers</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=questionnaires">Questionnaires</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=prompts">Prompts</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=analytics">Analytics</a>
                <span className="rounded-full bg-secondary px-4 py-2 text-secondary-foreground">Revenue</span>
              </div>
            </div>

            <form action="/api/admin/logout" method="post">
              <button className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary" type="submit">Log out</button>
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Date window</h2>
              <p className="mt-1 text-sm text-muted-foreground">Metrics use approved matched conversions divided by tracked clicks for conversion rate and EPC.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-foreground">From
                <input className="mt-2 h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
              </label>
              <label className="text-sm font-medium text-foreground">To
                <input className="mt-2 h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setTo(event.target.value)} type="date" value={to} />
              </label>
              <button className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" onClick={() => void loadRevenue(from, to)} type="button">Refresh revenue</button>
            </div>
          </div>
        </div>

        {errorMessage ? <div className="rounded-2xl border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm text-[#7d3d2f]">{errorMessage}</div> : null}

        {isLoading || !revenue ? (
          <div className="rounded-[2rem] border border-border bg-white p-6 text-sm text-muted-foreground shadow-[0_18px_60px_rgba(67,47,31,0.08)]">Loading revenue analytics...</div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]"><p className="text-sm text-muted-foreground">Tracked clicks</p><p className="mt-3 text-3xl font-semibold text-foreground">{revenue.summary.totalClicks}</p></div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]"><p className="text-sm text-muted-foreground">Total conversions</p><p className="mt-3 text-3xl font-semibold text-foreground">{revenue.summary.totalConversions}</p></div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]"><p className="text-sm text-muted-foreground">Approved conversions</p><p className="mt-3 text-3xl font-semibold text-foreground">{revenue.summary.approvedConversions}</p></div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]"><p className="text-sm text-muted-foreground">Attributed revenue</p><p className="mt-3 text-3xl font-semibold text-foreground">{formatMoney(revenue.summary.attributedRevenue, revenue.summary.currency)}</p></div>
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_60px_rgba(67,47,31,0.08)]"><p className="text-sm text-muted-foreground">EPC</p><p className="mt-3 text-3xl font-semibold text-foreground">{formatMoney(revenue.summary.epc, revenue.summary.currency)}</p><p className="mt-1 text-sm text-muted-foreground">CVR {formatPercent(revenue.summary.conversionRate)}</p></div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Add partner</h2>
                <p className="mt-1 text-sm text-muted-foreground">Create partner metadata so conversions can roll up by network or program.</p>
                <form className="mt-5 space-y-4" onSubmit={handlePartnerSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setPartnerForm((current) => ({ ...current, name: event.target.value }))} placeholder="Partner name" value={partnerForm.name} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setPartnerForm((current) => ({ ...current, slug: event.target.value }))} placeholder="partner-slug" value={partnerForm.slug} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setPartnerForm((current) => ({ ...current, network: event.target.value }))} placeholder="Network" value={partnerForm.network} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setPartnerForm((current) => ({ ...current, default_currency: event.target.value.toUpperCase() }))} placeholder="USD" value={partnerForm.default_currency} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setPartnerForm((current) => ({ ...current, commission_model: event.target.value }))} placeholder="Commission model" value={partnerForm.commission_model} />
                  </div>
                  <Button disabled={isSavingPartner} type="submit">{isSavingPartner ? 'Saving partner...' : 'Create partner'}</Button>
                </form>
              </div>

              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Record conversion</h2>
                <p className="mt-1 text-sm text-muted-foreground">Manual ingestion path for testing attribution and revenue formulas without a live network integration.</p>
                <form className="mt-5 space-y-4" onSubmit={handleConversionSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, partner_id: event.target.value }))} value={conversionForm.partner_id}>
                      <option value="">No partner</option>
                      {revenue.partnersCatalog.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
                    </select>
                    <select className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, offer_id: event.target.value }))} value={conversionForm.offer_id}>
                      <option value="">Auto-match from sub_id or leave blank</option>
                      {revenue.offers.map((offer) => <option key={offer.offer_id} value={offer.offer_id}>{offer.name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, sub_id: event.target.value }))} placeholder="Tracked sub_id" value={conversionForm.sub_id} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, partner_conversion_id: event.target.value }))} placeholder="Partner conversion ID" value={conversionForm.partner_conversion_id} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <select className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, status: event.target.value as ConversionFormState['status'] }))} value={conversionForm.status}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="paid">Paid</option>
                    </select>
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, conversion_value: event.target.value }))} placeholder="Conversion value" type="number" value={conversionForm.conversion_value} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, commission_value: event.target.value }))} placeholder="Commission value" required type="number" value={conversionForm.commission_value} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} placeholder="USD" value={conversionForm.currency} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, occurred_at: event.target.value }))} type="datetime-local" value={conversionForm.occurred_at} />
                    <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setConversionForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes or source info" value={conversionForm.notes} />
                  </div>
                  <Button disabled={isSavingConversion} type="submit">{isSavingConversion ? 'Saving conversion...' : 'Record conversion'}</Button>
                </form>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Offer monetization</h2>
                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-border/80">
                  <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                    <thead className="bg-[#faf6ee] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Offer</th>
                        <th className="px-4 py-3 font-medium">Clicks</th>
                        <th className="px-4 py-3 font-medium">Approved</th>
                        <th className="px-4 py-3 font-medium">Revenue</th>
                        <th className="px-4 py-3 font-medium">EPC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70 bg-white">
                      {revenue.offers.map((offer) => (
                        <tr key={offer.offer_id}>
                          <td className="px-4 py-3 text-foreground">{offer.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{offer.clicks}</td>
                          <td className="px-4 py-3 text-muted-foreground">{offer.approvedConversions}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatMoney(offer.attributedRevenue, revenue.summary.currency)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatMoney(offer.epc, revenue.summary.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Partner monetization</h2>
                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-border/80">
                  <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                    <thead className="bg-[#faf6ee] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Partner</th>
                        <th className="px-4 py-3 font-medium">Conversions</th>
                        <th className="px-4 py-3 font-medium">Approved</th>
                        <th className="px-4 py-3 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70 bg-white">
                      {revenue.partners.length === 0 ? (
                        <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>No partner data yet.</td></tr>
                      ) : revenue.partners.map((partner) => (
                        <tr key={partner.partner_id}>
                          <td className="px-4 py-3 text-foreground">{partner.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{partner.conversions}</td>
                          <td className="px-4 py-3 text-muted-foreground">{partner.approvedConversions}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatMoney(partner.attributedRevenue, revenue.summary.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <h2 className="text-2xl font-semibold text-foreground">Recent conversions</h2>
              <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-border/80">
                <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                  <thead className="bg-[#faf6ee] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Partner</th>
                      <th className="px-4 py-3 font-medium">Offer</th>
                      <th className="px-4 py-3 font-medium">Sub ID</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Attribution</th>
                      <th className="px-4 py-3 font-medium">Commission</th>
                      <th className="px-4 py-3 font-medium">Occurred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70 bg-white">
                    {revenue.conversions.length === 0 ? (
                      <tr><td className="px-4 py-6 text-muted-foreground" colSpan={7}>No conversions recorded yet.</td></tr>
                    ) : revenue.conversions.map((conversion) => (
                      <tr key={conversion.id}>
                        <td className="px-4 py-3 text-foreground">{conversion.partner_name ?? 'Unassigned'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{conversion.offer_name ?? 'Unmatched'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{conversion.sub_id ?? 'n/a'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{conversion.status}</td>
                        <td className="px-4 py-3 text-muted-foreground">{conversion.attribution_state}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatMoney(conversion.commission_value, conversion.currency)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(conversion.occurred_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}