import 'server-only';

import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';
import type {
  AdminAnalyticsActivityPoint,
  AdminAnalyticsResponse,
  AdminOfferAnalyticsItem,
} from '@/types/admin';

type AnalyticsWindow = {
  from: string;
  to: string;
};

type ConversationRow = {
  id: string;
  session_id: string;
  created_at: string;
  recommendation_generated: boolean;
};

type RecommendationRow = {
  offer_id: string;
  created_at: string;
};

type ClickRow = {
  offer_id: string;
  session_id: string;
  created_at: string;
};

type OfferNameRow = {
  id: string;
  name: string;
};

function startOfDayIso(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next.toISOString();
}

function endOfDayIso(date: Date) {
  const next = new Date(date);
  next.setUTCHours(23, 59, 59, 999);
  return next.toISOString();
}

export function getDefaultAnalyticsWindow(): AnalyticsWindow {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - 29);

  return {
    from: startOfDayIso(fromDate),
    to: endOfDayIso(toDate),
  };
}

export function resolveAnalyticsWindow(from?: string | null, to?: string | null): AnalyticsWindow {
  if (!from && !to) {
    return getDefaultAnalyticsWindow();
  }

  const fromDate = from ? new Date(from) : new Date(getDefaultAnalyticsWindow().from);
  const toDate = to ? new Date(to) : new Date(getDefaultAnalyticsWindow().to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid analytics date range.');
  }

  if (fromDate > toDate) {
    throw new Error('Analytics date range must have from <= to.');
  }

  return {
    from: startOfDayIso(fromDate),
    to: endOfDayIso(toDate),
  };
}

function roundRate(value: number) {
  return Number(value.toFixed(4));
}

export function buildAdminAnalyticsResponse(input: {
  window: AnalyticsWindow;
  conversations: ConversationRow[];
  recommendations: RecommendationRow[];
  clicks: ClickRow[];
  offers: OfferNameRow[];
}): AdminAnalyticsResponse {
  const offerNames = new Map(input.offers.map((offer) => [offer.id, offer.name]));
  const totalConversations = input.conversations.length;
  const recommendationsGenerated = input.conversations.filter(
    (conversation) => conversation.recommendation_generated,
  ).length;
  const totalClicks = input.clicks.length;
  const clickedSessions = new Set(input.clicks.map((click) => click.session_id));

  const clicksByOffer = new Map<string, number>();
  const recommendationsByOffer = new Map<string, number>();

  for (const recommendation of input.recommendations) {
    recommendationsByOffer.set(
      recommendation.offer_id,
      (recommendationsByOffer.get(recommendation.offer_id) ?? 0) + 1,
    );
  }

  for (const click of input.clicks) {
    clicksByOffer.set(click.offer_id, (clicksByOffer.get(click.offer_id) ?? 0) + 1);
  }

  const offerIds = Array.from(
    new Set([...recommendationsByOffer.keys(), ...clicksByOffer.keys()]),
  );

  const offers: AdminOfferAnalyticsItem[] = offerIds
    .map((offerId) => {
      const clicks = clicksByOffer.get(offerId) ?? 0;
      const recommendations = recommendationsByOffer.get(offerId) ?? 0;

      return {
        offer_id: offerId,
        name: offerNames.get(offerId) ?? 'Unknown offer',
        clicks,
        recommendations,
        ctr: recommendations > 0 ? roundRate(clicks / recommendations) : 0,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const topOffersByClicks = [...offers]
    .sort((left, right) => {
      if (right.clicks !== left.clicks) {
        return right.clicks - left.clicks;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 5);

  const topClickedOffer = topOffersByClicks[0] && topOffersByClicks[0].clicks > 0
    ? {
        offer_id: topOffersByClicks[0].offer_id,
        name: topOffersByClicks[0].name,
        clicks: topOffersByClicks[0].clicks,
      }
    : undefined;

  const activityMap = new Map<string, AdminAnalyticsActivityPoint>();
  const cursor = new Date(input.window.from);
  const end = new Date(input.window.to);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    activityMap.set(key, {
      date: key,
      conversations: 0,
      recommendationsGenerated: 0,
      clicks: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const conversation of input.conversations) {
    const key = conversation.created_at.slice(0, 10);
    const point = activityMap.get(key);

    if (!point) {
      continue;
    }

    point.conversations += 1;
    if (conversation.recommendation_generated) {
      point.recommendationsGenerated += 1;
    }
  }

  for (const click of input.clicks) {
    const key = click.created_at.slice(0, 10);
    const point = activityMap.get(key);

    if (!point) {
      continue;
    }

    point.clicks += 1;
  }

  return {
    summary: {
      totalConversations,
      recommendationGenerationRate:
        totalConversations > 0 ? roundRate(recommendationsGenerated / totalConversations) : 0,
      totalClicks,
      metricDefinitions: {
        totalConversations: 'count(conversations.created_at in window)',
        recommendationGenerationRate:
          'count(conversations where recommendation_generated = true in window) / count(conversations in window)',
        ctrPerOffer:
          'clicks for that offer in the window / recommendations for that offer in the window',
        funnel:
          'conversations started, conversations with recommendations, sessions with at least one recommendation click',
      },
      topClickedOffer,
      funnel: {
        conversationsStarted: totalConversations,
        recommendationsGenerated,
        recommendationClicks: clickedSessions.size,
      },
    },
    offers,
    topOffersByClicks,
    activity: Array.from(activityMap.values()),
    window: input.window,
  };
}

export async function getAdminAnalytics(window: AnalyticsWindow) {
  const supabase = createServiceRoleSupabaseClient();
  const [conversationsResult, recommendationsResult, clicksResult, offersResult] =
    await Promise.all([
      supabase
        .from('conversations')
        .select('id, session_id, created_at, recommendation_generated')
        .gte('created_at', window.from)
        .lte('created_at', window.to),
      supabase
        .from('recommendations')
        .select('offer_id, created_at')
        .gte('created_at', window.from)
        .lte('created_at', window.to),
      supabase
        .from('clicks')
        .select('offer_id, session_id, created_at')
        .gte('created_at', window.from)
        .lte('created_at', window.to),
      supabase.from('offers').select('id, name'),
    ]);

  if (conversationsResult.error) {
    throw conversationsResult.error;
  }

  if (recommendationsResult.error) {
    throw recommendationsResult.error;
  }

  if (clicksResult.error) {
    throw clicksResult.error;
  }

  if (offersResult.error) {
    throw offersResult.error;
  }

  return buildAdminAnalyticsResponse({
    window,
    conversations: (conversationsResult.data as ConversationRow[]) ?? [],
    recommendations: (recommendationsResult.data as RecommendationRow[]) ?? [],
    clicks: (clicksResult.data as ClickRow[]) ?? [],
    offers: (offersResult.data as OfferNameRow[]) ?? [],
  });
}