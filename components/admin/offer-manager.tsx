'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { AdminOfferDetail, AdminOfferInput, AdminOfferListItem } from '@/types/admin';

type OfferFilters = {
  query: string;
  status: 'all' | 'active' | 'inactive';
  category: string;
};

type OfferFormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  affiliate_url: string;
  logo_url: string;
  pricing_model: string;
  commission_info: string;
  is_active: boolean;
};

const EMPTY_FORM: OfferFormState = {
  name: '',
  slug: '',
  description: '',
  category: '',
  tags: '',
  affiliate_url: '',
  logo_url: '',
  pricing_model: '',
  commission_info: '',
  is_active: true,
};

function mapOfferDetailToFormState(offer: AdminOfferDetail): OfferFormState {
  return {
    name: offer.name,
    slug: offer.slug,
    description: offer.description,
    category: offer.category,
    tags: offer.tags.join(', '),
    affiliate_url: offer.affiliate_url,
    logo_url: offer.logo_url ?? '',
    pricing_model: offer.pricing_model ?? '',
    commission_info: offer.commission_info ?? '',
    is_active: offer.is_active,
  };
}

function mapFormStateToPayload(formState: OfferFormState): AdminOfferInput {
  return {
    name: formState.name,
    slug: formState.slug,
    description: formState.description,
    category: formState.category,
    tags: formState.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    affiliate_url: formState.affiliate_url,
    logo_url: formState.logo_url || undefined,
    pricing_model: formState.pricing_model || undefined,
    commission_info: formState.commission_info || undefined,
    is_active: formState.is_active,
  };
}

export function OfferManager() {
  const [offers, setOffers] = useState<AdminOfferListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<OfferFilters>({
    query: '',
    status: 'all',
    category: 'all',
  });
  const [formState, setFormState] = useState<OfferFormState>(EMPTY_FORM);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const latestDetailRequestIdRef = useRef(0);

  async function loadOffers(nextFilters: OfferFilters) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const searchParams = new URLSearchParams();

      if (nextFilters.query) {
        searchParams.set('query', nextFilters.query);
      }

      searchParams.set('status', nextFilters.status);

      if (nextFilters.category !== 'all') {
        searchParams.set('category', nextFilters.category);
      }

      const response = await fetch(`/api/admin/offers?${searchParams.toString()}`);
      const payload = (await response.json()) as {
        offers?: AdminOfferListItem[];
        categories?: string[];
        error?: string;
      };

      if (!response.ok || !payload.offers) {
        throw new Error(payload.error || 'Failed to load offers.');
      }

      setOffers(payload.offers);
      setCategories(payload.categories ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load offers.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOffers(filters);
  }, [filters]);

  async function loadOfferDetail(id: string) {
    const requestId = latestDetailRequestIdRef.current + 1;
    latestDetailRequestIdRef.current = requestId;
    setErrorMessage('');
    setFieldErrors({});

    try {
      const response = await fetch(`/api/admin/offers/${id}`);
      const payload = (await response.json()) as {
        offer?: AdminOfferDetail;
        error?: string;
      };

      if (!response.ok || !payload.offer) {
        throw new Error(payload.error || 'Failed to load offer.');
      }

      if (latestDetailRequestIdRef.current !== requestId) {
        return;
      }

      setSelectedOfferId(id);
      setFormState(mapOfferDetailToFormState(payload.offer));
    } catch (error) {
      if (latestDetailRequestIdRef.current !== requestId) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Failed to load offer.');
    }
  }

  async function persistOffer(nextState: OfferFormState) {
    setIsSaving(true);
    setErrorMessage('');
    setFieldErrors({});

    try {
      const response = await fetch(
        selectedOfferId ? `/api/admin/offers/${selectedOfferId}` : '/api/admin/offers',
        {
          method: selectedOfferId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mapFormStateToPayload(nextState)),
        },
      );
      const payload = (await response.json()) as {
        offer?: AdminOfferDetail;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !payload.offer) {
        setFieldErrors(payload.fieldErrors ?? {});
        throw new Error(payload.error || 'Failed to save offer.');
      }

      setSelectedOfferId(payload.offer.id);
      setFormState(mapOfferDetailToFormState(payload.offer));
      await loadOffers(filters);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save offer.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistOffer(formState);
  }

  async function handleDeactivate() {
    if (!selectedOfferId) {
      return;
    }

    const nextState = { ...formState, is_active: false };
    setFormState(nextState);
    await persistOffer(nextState);
  }

  const previewTags = useMemo(
    () => formState.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [formState.tags],
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe3_0%,#fcfaf5_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Protected Admin
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground">
                Offer Catalog Manager
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                Create, edit, preview, search, and deactivate offers without direct database access. Inactive offers remain visible so historical recommendations and clicks stay compatible.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-secondary px-4 py-2 text-secondary-foreground">Offers</span>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=questionnaires">Questionnaires</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=prompts">Prompts</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=analytics">Analytics</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=revenue">Revenue</a>
              </div>
            </div>

            <form action="/api/admin/logout" method="post">
              <button
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
            <div className="flex flex-col gap-4 border-b border-border/80 pb-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-foreground">Offers</h2>
                <Button
                  onClick={() => {
                    latestDetailRequestIdRef.current += 1;
                    setSelectedOfferId(null);
                    setFormState(EMPTY_FORM);
                    setFieldErrors({});
                    setErrorMessage('');
                  }}
                  type="button"
                  variant="outline"
                >
                  New offer
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  aria-label="Search offers"
                  className="h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, query: event.target.value }))
                  }
                  placeholder="Search by name or slug"
                  value={filters.query}
                />
                <select
                  aria-label="Filter by status"
                  className="h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value as OfferFilters['status'],
                    }))
                  }
                  value={filters.status}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  aria-label="Filter by category"
                  className="h-11 rounded-full border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, category: event.target.value }))
                  }
                  value={filters.category}
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm text-[#7d3d2f]">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border/80">
              <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                <thead className="bg-[#faf6ee] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Pricing</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-white">
                  {isLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                        Loading offers...
                      </td>
                    </tr>
                  ) : offers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                        No offers matched the current filters.
                      </td>
                    </tr>
                  ) : (
                    offers.map((offer) => (
                      <tr
                        className={`cursor-pointer transition-colors hover:bg-[#faf6ee] ${
                          selectedOfferId === offer.id ? 'bg-[#f4efe3]' : ''
                        }`}
                        key={offer.id}
                        onClick={() => {
                          void loadOfferDetail(offer.id);
                        }}
                      >
                        <td className="px-4 py-4 font-medium text-foreground">
                          <div>{offer.name}</div>
                          <div className="text-xs text-muted-foreground">{offer.slug}</div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{offer.category}</td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {offer.pricing_model || 'n/a'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${offer.is_active ? 'bg-[#e8f2ec] text-[#1b5c40]' : 'bg-[#f6e4d8] text-[#8f4f2f]'}`}>
                            {offer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {new Date(offer.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {selectedOfferId ? 'Edit offer' : 'Create offer'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Support the full MVP offer field set and preserve inactive records for historical compatibility.
                  </p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-name">Name</label>
                    <input id="offer-name" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
                    {fieldErrors.name ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.name}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-slug">Slug</label>
                    <input id="offer-slug" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.slug} onChange={(event) => setFormState((current) => ({ ...current, slug: event.target.value }))} />
                    {fieldErrors.slug ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.slug}</p> : null}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-description">Description</label>
                  <textarea id="offer-description" className="min-h-[6rem] w-full rounded-[1rem] border border-input px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
                  {fieldErrors.description ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.description}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-category">Category</label>
                    <input id="offer-category" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.category} onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))} />
                    {fieldErrors.category ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.category}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-tags">Tags</label>
                    <input id="offer-tags" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.tags} onChange={(event) => setFormState((current) => ({ ...current, tags: event.target.value }))} />
                    {fieldErrors.tags ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.tags}</p> : null}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-affiliate-url">Affiliate URL</label>
                  <input id="offer-affiliate-url" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.affiliate_url} onChange={(event) => setFormState((current) => ({ ...current, affiliate_url: event.target.value }))} />
                  {fieldErrors.affiliate_url ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.affiliate_url}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-logo-url">Logo URL</label>
                    <input id="offer-logo-url" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.logo_url} onChange={(event) => setFormState((current) => ({ ...current, logo_url: event.target.value }))} />
                    {fieldErrors.logo_url ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.logo_url}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-pricing-model">Pricing model</label>
                    <input id="offer-pricing-model" className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.pricing_model} onChange={(event) => setFormState((current) => ({ ...current, pricing_model: event.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="offer-commission-info">Commission info</label>
                  <textarea id="offer-commission-info" className="min-h-[5rem] w-full rounded-[1rem] border border-input px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formState.commission_info} onChange={(event) => setFormState((current) => ({ ...current, commission_info: event.target.value }))} />
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <input checked={formState.is_active} onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" />
                  Offer is active
                </label>

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSaving} type="submit">
                    {isSaving ? 'Saving...' : selectedOfferId ? 'Save changes' : 'Create offer'}
                  </Button>
                  {selectedOfferId ? (
                    <Button
                      disabled={isSaving || !formState.is_active}
                      onClick={() => {
                        void handleDeactivate();
                      }}
                      type="button"
                      variant="outline"
                    >
                      Mark inactive
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <h2 className="text-2xl font-semibold text-foreground">Offer preview</h2>
              <div className="mt-4 rounded-[1.5rem] border border-border bg-[#fcfaf5] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary text-sm font-semibold text-muted-foreground">
                    {formState.name ? formState.name.slice(0, 2).toUpperCase() : 'OF'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
                        <h3 className="mt-1 text-xl font-semibold text-foreground">
                          {formState.name || 'Offer name'}
                        </h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${formState.is_active ? 'bg-[#e8f2ec] text-[#1b5c40]' : 'bg-[#f6e4d8] text-[#8f4f2f]'}`}>
                        {formState.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {formState.description || 'Description preview will appear here.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {previewTags.length ? previewTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {tag}
                        </span>
                      )) : <span className="text-xs text-muted-foreground">No tags yet.</span>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Category: {formState.category || 'n/a'}</span>
                      <span>Pricing: {formState.pricing_model || 'n/a'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}