import 'server-only';

import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';
import type { AdminOfferDetail, AdminOfferInput, AdminOfferListItem } from '@/types/admin';

type OfferQuery = {
  query?: string;
  status?: 'all' | 'active' | 'inactive';
  category?: string;
};

export async function listAdminOffers(filters: OfferQuery = {}) {
  const supabase = createServiceRoleSupabaseClient();
  let query = supabase
    .from('offers')
    .select('id, name, slug, category, pricing_model, is_active, updated_at')
    .order('updated_at', { ascending: false });

  if (filters.status === 'active') {
    query = query.eq('is_active', true);
  }

  if (filters.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters.query?.trim()) {
    const trimmedQuery = filters.query.trim();
    query = query.or(`name.ilike.%${trimmedQuery}%,slug.ilike.%${trimmedQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as AdminOfferListItem[]) ?? [];
}

export async function getOfferCategories() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('offers')
    .select('category')
    .order('category', { ascending: true });

  if (error) {
    throw error;
  }

  return Array.from(
    new Set((data ?? []).map((row) => String((row as { category: string }).category))),
  );
}

export async function getAdminOfferById(id: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('offers')
    .select(
      'id, name, slug, description, category, tags, affiliate_url, logo_url, pricing_model, commission_info, is_active, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AdminOfferDetail | null) ?? null;
}

export async function createAdminOffer(input: AdminOfferInput) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('offers')
    .insert({
      ...input,
      logo_url: input.logo_url ?? null,
      pricing_model: input.pricing_model ?? null,
      commission_info: input.commission_info ?? null,
    })
    .select(
      'id, name, slug, description, category, tags, affiliate_url, logo_url, pricing_model, commission_info, is_active, created_at, updated_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return data as AdminOfferDetail;
}

export async function updateAdminOffer(id: string, input: AdminOfferInput) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('offers')
    .update({
      ...input,
      logo_url: input.logo_url ?? null,
      pricing_model: input.pricing_model ?? null,
      commission_info: input.commission_info ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, name, slug, description, category, tags, affiliate_url, logo_url, pricing_model, commission_info, is_active, created_at, updated_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return data as AdminOfferDetail;
}