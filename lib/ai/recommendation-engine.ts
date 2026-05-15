import type { CollectedContext, RecommendationItem } from '@/types/chat';
import type { OfferRecord } from '@/types/database';

function normalizeCategoryToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getCategoryMatchedOffers(context: CollectedContext, offers: OfferRecord[]) {
  if (!context.useCase) {
    return offers;
  }

  const useCase = normalizeCategoryToken(context.useCase);
  const matchedOffers = offers.filter(
    (offer) => normalizeCategoryToken(offer.category) === useCase,
  );

  return matchedOffers.length > 0 ? matchedOffers : offers;
}

function scoreCategoryFit(context: CollectedContext, offer: OfferRecord) {
  if (!context.useCase) {
    return 0;
  }

  const useCase = normalizeCategoryToken(context.useCase);
  const normalizedCategory = normalizeCategoryToken(offer.category);
  const haystack = `${offer.category} ${offer.tags.join(' ')} ${offer.description}`.toLowerCase();

  if (normalizedCategory === useCase) {
    return 60;
  }

  if (haystack.includes(useCase) || useCase.includes(offer.category.toLowerCase())) {
    return 35;
  }

  return 0;
}

function scoreTeamSizeFit(context: CollectedContext, offer: OfferRecord) {
  if (!context.teamSize) {
    return 0;
  }

  if (context.teamSize === 'solo' && offer.pricing_model === 'freemium') {
    return 15;
  }

  if (
    context.teamSize === 'small_team' &&
    ['freemium', 'subscription'].includes(offer.pricing_model ?? '')
  ) {
    return 12;
  }

  if (context.teamSize === 'enterprise' && offer.pricing_model === 'subscription') {
    return 12;
  }

  return 6;
}

function scoreBudgetFit(context: CollectedContext, offer: OfferRecord) {
  if (!context.budget) {
    return 0;
  }

  if (context.budget === 'low' && offer.pricing_model === 'freemium') {
    return 20;
  }

  if (context.budget === 'medium' && offer.pricing_model === 'subscription') {
    return 14;
  }

  if (context.budget === 'high' && offer.pricing_model === 'subscription') {
    return 10;
  }

  return 4;
}

function scorePriorityFit(context: CollectedContext, offer: OfferRecord) {
  const priorities = context.priorities ?? [];

  if (priorities.length === 0) {
    return 0;
  }

  const haystack = `${offer.tags.join(' ')} ${offer.description}`.toLowerCase();

  return priorities.reduce((score, priority) => {
    return score + (haystack.includes(priority.toLowerCase()) ? 10 : 0);
  }, 0);
}

function buildMatchReason(context: CollectedContext, offer: OfferRecord) {
  const reasons: string[] = [];
  const hasExactCategoryMatch =
    context.useCase && normalizeCategoryToken(offer.category) === normalizeCategoryToken(context.useCase);

  if (hasExactCategoryMatch) {
    reasons.push(`fits your ${context.useCase} use case`);
  }

  if (context.budget === 'low' && offer.pricing_model === 'freemium') {
    reasons.push('keeps cost low');
  }

  if (
    (context.priorities ?? []).some((priority) =>
      offer.tags.join(' ').toLowerCase().includes(priority),
    )
  ) {
    reasons.push('matches your stated priorities');
  }

  if (reasons.length === 0) {
    reasons.push('matches your requirements based on category, pricing, and workflow fit');
  }

  return `${offer.name} ${reasons.join(', ')}.`;
}

export function buildFallbackRecommendations(
  context: CollectedContext,
  offers: OfferRecord[],
): RecommendationItem[] {
  return getCategoryMatchedOffers(context, offers)
    .filter((offer) => offer.is_active)
    .map((offer) => {
      const score = Math.min(
        100,
        scoreCategoryFit(context, offer) +
          scoreTeamSizeFit(context, offer) +
          scoreBudgetFit(context, offer) +
          scorePriorityFit(context, offer) +
          5,
      );

      return {
        offer_id: offer.id,
        rank: 0,
        match_score: score,
        match_reason: buildMatchReason(context, offer),
        name: offer.name,
        description: offer.description,
        affiliate_url: offer.affiliate_url,
        logo_url: offer.logo_url,
      };
    })
    .sort((left, right) => right.match_score - left.match_score)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}