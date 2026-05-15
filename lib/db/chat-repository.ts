import 'server-only';

import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';
import type {
  RecommendationItem,
  StoredMessageRole,
  TrackClickRequest,
} from '@/types/chat';
import type {
  ClickRecord,
  ConversationRecord,
  MessageRecord,
  OfferRecord,
} from '@/types/database';

export async function getLatestConversationForSession(sessionId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('id, session_id, recommendation_generated')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ConversationRecord | null) ?? null;
}

export async function createConversation(sessionId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .insert({ session_id: sessionId })
    .select('id, session_id, recommendation_generated')
    .single();

  if (error) {
    throw error;
  }

  return data as ConversationRecord;
}

export async function getConversationMessages(conversationId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as MessageRecord[]) ?? [];
}

export async function insertMessage(
  conversationId: string,
  role: StoredMessageRole,
  content: string,
) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
  });

  if (error) {
    throw error;
  }
}

export async function getActiveOffers() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('offers')
    .select(
      'id, name, slug, description, category, tags, affiliate_url, logo_url, pricing_model, commission_info, is_active',
    )
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as OfferRecord[]) ?? [];
}

export async function saveRecommendations(
  conversationId: string,
  recommendations: RecommendationItem[],
) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('recommendations')
    .insert(
      recommendations.map((recommendation) => ({
        conversation_id: conversationId,
        offer_id: recommendation.offer_id,
        rank: recommendation.rank,
        match_score: recommendation.match_score,
        match_reason: recommendation.match_reason,
      })),
    )
    .select('id, offer_id, rank, match_score, match_reason');

  if (error) {
    throw error;
  }

  const idsByOfferAndRank = new Map(
    (((data as Array<{
      id: string;
      offer_id: string;
      rank: number;
      match_score: number;
      match_reason: string;
    }>) ?? [])).map((row) => [`${row.offer_id}:${row.rank}`, row.id]),
  );

  return recommendations.map((recommendation) => ({
    ...recommendation,
    recommendation_id: idsByOfferAndRank.get(
      `${recommendation.offer_id}:${recommendation.rank}`,
    ),
  }));
}

export async function markConversationRecommended(conversationId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from('conversations')
    .update({ recommendation_generated: true, completed_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    throw error;
  }
}

export async function insertAnalyticsEvent(
  eventName: string,
  sessionId: string,
  properties: Record<string, unknown> = {},
) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from('analytics_events').insert({
    event_name: eventName,
    session_id: sessionId,
    properties,
  });

  if (error) {
    throw error;
  }
}

export async function getRecentClickForSessionAndOffer(
  sessionId: string,
  offerId: string,
  sinceIso: string,
) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('clicks')
    .select(
      'id, recommendation_id, offer_id, session_id, sub_id, utm_source, utm_medium, utm_campaign, referrer, created_at',
    )
    .eq('session_id', sessionId)
    .eq('offer_id', offerId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ClickRecord | null) ?? null;
}

export async function insertClick(payload: TrackClickRequest) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('clicks')
    .insert({
      recommendation_id: payload.recommendation_id ?? null,
      offer_id: payload.offer_id,
      session_id: payload.session_id,
      sub_id: payload.sub_id,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      referrer: payload.referrer ?? null,
    })
    .select(
      'id, recommendation_id, offer_id, session_id, sub_id, utm_source, utm_medium, utm_campaign, referrer, created_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return data as ClickRecord;
}