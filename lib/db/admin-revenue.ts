import 'server-only';

import { resolveAnalyticsWindow } from '@/lib/db/admin-analytics';
import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';
import type {
  AdminConversionInput,
  AdminConversionListItem,
  AdminPartnerListItem,
  AdminRevenueOfferItem,
  AdminRevenuePartnerItem,
  AdminRevenueResponse,
} from '@/types/admin';
import type { ClickRecord, ConversionRecord, PartnerRecord } from '@/types/database';

type RevenueWindow = {
  from: string;
  to: string;
};

type OfferNameRow = {
  id: string;
  name: string;
};

function roundRate(value: number) {
  return Number(value.toFixed(4));
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function resolveRevenueWindow(from?: string | null, to?: string | null): RevenueWindow {
  return resolveAnalyticsWindow(from, to);
}

export async function listAdminPartners() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, slug, network, default_currency, commission_model, is_active')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as AdminPartnerListItem[]) ?? [];
}

export async function createAdminPartner(input: {
  name: string;
  slug: string;
  network?: string;
  default_currency?: string;
  commission_model?: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('partners')
    .insert({
      name: input.name,
      slug: input.slug,
      network: input.network ?? null,
      default_currency: input.default_currency ?? 'USD',
      commission_model: input.commission_model ?? null,
      is_active: true,
    })
    .select('id, name, slug, network, default_currency, commission_model, is_active')
    .single();

  if (error) {
    throw error;
  }

  return data as AdminPartnerListItem;
}

async function getClickBySubId(subId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('clicks')
    .select(
      'id, recommendation_id, offer_id, session_id, sub_id, utm_source, utm_medium, utm_campaign, referrer, created_at',
    )
    .eq('sub_id', subId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ClickRecord | null) ?? null;
}

async function getPartnerBySlug(slug: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, slug, network, default_currency, commission_model, is_active, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PartnerRecord | null) ?? null;
}

async function findDuplicateConversion(partnerId?: string, partnerConversionId?: string) {
  if (!partnerId || !partnerConversionId) {
    return null;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('conversions')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('partner_conversion_id', partnerConversionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as { id: string } | null) ?? null;
}

function normalizeCurrency(value?: string) {
  const normalized = value?.trim().toUpperCase();
  return normalized || 'USD';
}

export async function createAdminConversion(
  input: AdminConversionInput,
  sourcePayload?: Record<string, unknown>,
) {
  const duplicate = await findDuplicateConversion(input.partner_id, input.partner_conversion_id);

  if (duplicate) {
    throw new Error('A conversion with that partner conversion identifier already exists.');
  }

  const click = input.sub_id ? await getClickBySubId(input.sub_id) : null;
  const attributionState = click
    ? 'matched'
    : input.offer_id
      ? 'manual_match'
      : 'unmatched';
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('conversions')
    .insert({
      partner_id: input.partner_id ?? null,
      offer_id: input.offer_id ?? click?.offer_id ?? null,
      click_id: click?.id ?? null,
      sub_id: input.sub_id ?? null,
      partner_conversion_id: input.partner_conversion_id ?? null,
      status: input.status,
      conversion_value: typeof input.conversion_value === 'number' ? input.conversion_value : null,
      commission_value: input.commission_value,
      currency: normalizeCurrency(input.currency),
      occurred_at: input.occurred_at,
      source_type: input.source_type ?? 'manual',
      source_payload: sourcePayload ?? input.source_payload ?? {},
      attribution_state: attributionState,
      notes: input.notes ?? null,
    })
    .select(
      'id, partner_id, offer_id, click_id, sub_id, partner_conversion_id, status, conversion_value, commission_value, currency, occurred_at, recorded_at, source_type, source_payload, attribution_state, notes',
    )
    .single();

  if (error) {
    throw error;
  }

  return data as ConversionRecord;
}

export async function updateAdminConversion(
  id: string,
  input: Partial<AdminConversionInput>,
) {
  const click = input.sub_id ? await getClickBySubId(input.sub_id) : null;
  const nextOfferId = input.offer_id ?? click?.offer_id ?? null;
  const nextAttributionState = click
    ? 'matched'
    : nextOfferId
      ? 'manual_match'
      : 'unmatched';
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('conversions')
    .update({
      partner_id: input.partner_id ?? undefined,
      offer_id: nextOfferId,
      click_id: click?.id ?? undefined,
      sub_id: input.sub_id ?? undefined,
      partner_conversion_id: input.partner_conversion_id ?? undefined,
      status: input.status ?? undefined,
      conversion_value:
        typeof input.conversion_value === 'number' ? input.conversion_value : undefined,
      commission_value:
        typeof input.commission_value === 'number' ? input.commission_value : undefined,
      currency: input.currency ? normalizeCurrency(input.currency) : undefined,
      occurred_at: input.occurred_at ?? undefined,
      source_type: input.source_type ?? undefined,
      source_payload: input.source_payload ?? undefined,
      attribution_state: nextAttributionState,
      notes: input.notes ?? undefined,
    })
    .eq('id', id)
    .select(
      'id, partner_id, offer_id, click_id, sub_id, partner_conversion_id, status, conversion_value, commission_value, currency, occurred_at, recorded_at, source_type, source_payload, attribution_state, notes',
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ConversionRecord | null) ?? null;
}

export async function getAdminRevenue(window: RevenueWindow): Promise<AdminRevenueResponse> {
  const supabase = createServiceRoleSupabaseClient();
  const [clicksResult, conversionsResult, offersResult, partnersResult] = await Promise.all([
    supabase
      .from('clicks')
      .select('id, offer_id, session_id, sub_id, created_at')
      .gte('created_at', window.from)
      .lte('created_at', window.to),
    supabase
      .from('conversions')
      .select(
        'id, partner_id, offer_id, click_id, sub_id, partner_conversion_id, status, conversion_value, commission_value, currency, occurred_at, recorded_at, source_type, source_payload, attribution_state, notes',
      )
      .gte('occurred_at', window.from)
      .lte('occurred_at', window.to)
      .order('occurred_at', { ascending: false }),
    supabase.from('offers').select('id, name').order('name', { ascending: true }),
    supabase
      .from('partners')
      .select('id, name, slug, network, default_currency, commission_model, is_active')
      .order('name', { ascending: true }),
  ]);

  if (clicksResult.error) {
    throw clicksResult.error;
  }

  if (conversionsResult.error) {
    throw conversionsResult.error;
  }

  if (offersResult.error) {
    throw offersResult.error;
  }

  if (partnersResult.error) {
    throw partnersResult.error;
  }

  const clicks = ((clicksResult.data as Array<Pick<ClickRecord, 'id' | 'offer_id' | 'session_id' | 'sub_id' | 'created_at'>>) ?? []);
  const conversions = ((conversionsResult.data as ConversionRecord[]) ?? []);
  const offers = ((offersResult.data as OfferNameRow[]) ?? []);
  const partners = ((partnersResult.data as AdminPartnerListItem[]) ?? []);
  const offerNames = new Map(offers.map((offer) => [offer.id, offer.name]));
  const partnerNames = new Map(partners.map((partner) => [partner.id, partner.name]));
  const totalClicks = clicks.length;
  const totalConversions = conversions.filter(
    (conversion) => conversion.attribution_state !== 'duplicate_rejected',
  ).length;
  const approvedMatchedConversions = conversions.filter(
    (conversion) =>
      ['approved', 'paid'].includes(conversion.status) &&
      conversion.attribution_state === 'matched',
  );
  const approvedConversions = approvedMatchedConversions.length;
  const attributedRevenue = roundMoney(
    approvedMatchedConversions.reduce(
      (sum, conversion) => sum + Number(conversion.commission_value ?? 0),
      0,
    ),
  );
  const clicksByOffer = new Map<string, number>();
  const conversionsByOffer = new Map<string, ConversionRecord[]>();
  const conversionsByPartner = new Map<string, ConversionRecord[]>();

  for (const click of clicks) {
    clicksByOffer.set(click.offer_id, (clicksByOffer.get(click.offer_id) ?? 0) + 1);
  }

  for (const conversion of conversions) {
    if (conversion.offer_id) {
      conversionsByOffer.set(conversion.offer_id, [
        ...(conversionsByOffer.get(conversion.offer_id) ?? []),
        conversion,
      ]);
    }

    if (conversion.partner_id) {
      conversionsByPartner.set(conversion.partner_id, [
        ...(conversionsByPartner.get(conversion.partner_id) ?? []),
        conversion,
      ]);
    }
  }

  const offersSummary: AdminRevenueOfferItem[] = offers.map((offer) => {
    const offerClicks = clicksByOffer.get(offer.id) ?? 0;
    const offerConversions = conversionsByOffer.get(offer.id) ?? [];
    const approvedOfferConversions = offerConversions.filter(
      (conversion) =>
        ['approved', 'paid'].includes(conversion.status) &&
        conversion.attribution_state === 'matched',
    );
    const offerRevenue = roundMoney(
      approvedOfferConversions.reduce(
        (sum, conversion) => sum + Number(conversion.commission_value ?? 0),
        0,
      ),
    );

    return {
      offer_id: offer.id,
      name: offer.name,
      clicks: offerClicks,
      conversions: offerConversions.filter(
        (conversion) => conversion.attribution_state !== 'duplicate_rejected',
      ).length,
      approvedConversions: approvedOfferConversions.length,
      attributedRevenue: offerRevenue,
      conversionRate: offerClicks > 0 ? roundRate(approvedOfferConversions.length / offerClicks) : 0,
      epc: offerClicks > 0 ? roundRate(offerRevenue / offerClicks) : 0,
    };
  });

  const partnersSummary: AdminRevenuePartnerItem[] = partners.map((partner) => {
    const partnerConversions = conversionsByPartner.get(partner.id) ?? [];
    const approvedPartnerConversions = partnerConversions.filter(
      (conversion) =>
        ['approved', 'paid'].includes(conversion.status) &&
        conversion.attribution_state === 'matched',
    );
    return {
      partner_id: partner.id,
      name: partner.name,
      conversions: partnerConversions.filter(
        (conversion) => conversion.attribution_state !== 'duplicate_rejected',
      ).length,
      approvedConversions: approvedPartnerConversions.length,
      attributedRevenue: roundMoney(
        approvedPartnerConversions.reduce(
          (sum, conversion) => sum + Number(conversion.commission_value ?? 0),
          0,
        ),
      ),
    };
  });

  const conversionRows: AdminConversionListItem[] = conversions.map((conversion) => ({
    id: conversion.id,
    partner_name: conversion.partner_id ? partnerNames.get(conversion.partner_id) ?? null : null,
    offer_name: conversion.offer_id ? offerNames.get(conversion.offer_id) ?? null : null,
    sub_id: conversion.sub_id ?? null,
    partner_conversion_id: conversion.partner_conversion_id ?? null,
    status: conversion.status,
    commission_value: Number(conversion.commission_value),
    currency: conversion.currency,
    occurred_at: conversion.occurred_at,
    attribution_state: conversion.attribution_state,
  }));

  return {
    summary: {
      totalClicks,
      totalConversions,
      approvedConversions,
      conversionRate: totalClicks > 0 ? roundRate(approvedConversions / totalClicks) : 0,
      attributedRevenue,
      epc: totalClicks > 0 ? roundRate(attributedRevenue / totalClicks) : 0,
      currency: partners[0]?.default_currency ?? 'USD',
      metricDefinitions: {
        totalConversions: 'count(all conversion records in window excluding duplicate_rejected)',
        approvedConversions: 'count(conversions where status in approved or paid and attribution_state = matched in window)',
        conversionRate: 'approved matched conversions / tracked clicks in window',
        epc: 'approved attributed revenue / tracked clicks in window',
      },
    },
    offers: offersSummary.sort((left, right) => right.attributedRevenue - left.attributedRevenue || left.name.localeCompare(right.name)),
    partners: partnersSummary.sort((left, right) => right.attributedRevenue - left.attributedRevenue || left.name.localeCompare(right.name)),
    conversions: conversionRows,
    partnersCatalog: partners,
    window,
  };
}

export async function getRevenueOffers(window: RevenueWindow) {
  const revenue = await getAdminRevenue(window);
  return revenue.offers;
}

export async function getRevenuePartners(window: RevenueWindow) {
  const revenue = await getAdminRevenue(window);
  return revenue.partners;
}

export async function ingestPartnerConversion(partnerKey: string, input: AdminConversionInput, rawPayload: Record<string, unknown>) {
  const partner = await getPartnerBySlug(partnerKey);

  if (!partner) {
    throw new Error('Partner not found.');
  }

  return createAdminConversion(
    {
      ...input,
      partner_id: partner.id,
      source_type: 'webhook',
    },
    rawPayload,
  );
}