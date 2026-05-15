import {
  buildUnsupportedDomainReply,
  buildFollowUpQuestion,
  deriveCollectedContext,
  hasMinimumRecommendationContext,
  isSupportedUseCase,
  mergeCollectedContext,
} from '@/lib/ai/context';
import { SUPPORTED_USE_CASES } from '@/lib/ai/constants';
import {
  requestOpenAiContextExtraction,
  requestOpenAiRecommendations,
} from '@/lib/ai/openai-provider';
import { loadActivePrompt } from '@/lib/ai/prompt-loader';
import { buildFallbackRecommendations } from '@/lib/ai/recommendation-engine';
import {
  createConversation,
  getActiveOffers,
  getConversationMessages,
  getLatestConversationForSession,
  insertAnalyticsEvent,
  insertMessage,
  markConversationRecommended,
  saveRecommendations,
} from '@/lib/db/chat-repository';
import type {
  ChatApiRequest,
  ChatServiceResult,
  ConversationMessage,
  RecommendationItem,
  RecommendationOutput,
} from '@/types/chat';
import type { OfferRecord } from '@/types/database';

function validateProviderRecommendations(
  providerOutput: RecommendationOutput,
  offers: OfferRecord[],
): RecommendationItem[] {
  const activeOffersById = new Map(offers.map((offer) => [offer.id, offer]));
  const uniqueOfferIds = new Set<string>();

  return (providerOutput.recommendations ?? [])
    .filter((recommendation) => {
      if (!activeOffersById.has(recommendation.offer_id)) {
        return false;
      }

      if (uniqueOfferIds.has(recommendation.offer_id)) {
        return false;
      }

      if (typeof recommendation.match_score !== 'number') {
        return false;
      }

      uniqueOfferIds.add(recommendation.offer_id);
      return recommendation.match_score >= 0 && recommendation.match_score <= 100;
    })
    .slice(0, 5)
    .map((recommendation, index) => {
      const offer = activeOffersById.get(recommendation.offer_id);

      if (!offer) {
        throw new Error('Validated recommendation offer is missing.');
      }

      return {
        offer_id: recommendation.offer_id,
        rank: index + 1,
        match_score: Math.round(recommendation.match_score),
        match_reason: recommendation.match_reason,
        name: offer.name,
        description: offer.description,
        affiliate_url: offer.affiliate_url,
        logo_url: offer.logo_url,
      };
    });
}

function ensureRecommendationTarget(
  providerRecommendations: RecommendationItem[],
  fallbackRecommendations: RecommendationItem[],
) {
  const minimumTarget = Math.min(3, fallbackRecommendations.length);

  if (providerRecommendations.length >= minimumTarget) {
    return providerRecommendations.slice(0, 5);
  }

  const merged = [...providerRecommendations];
  const seen = new Set(providerRecommendations.map((item) => item.offer_id));

  for (const fallback of fallbackRecommendations) {
    if (merged.length >= Math.min(5, fallbackRecommendations.length)) {
      break;
    }

    if (seen.has(fallback.offer_id)) {
      continue;
    }

    seen.add(fallback.offer_id);
    merged.push(fallback);
  }

  return merged.slice(0, 5).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

async function getOrCreateActiveConversation(sessionId: string) {
  const existingConversation = await getLatestConversationForSession(sessionId);

  if (existingConversation && !existingConversation.recommendation_generated) {
    return { conversation: existingConversation, isNewConversation: false };
  }

  const conversation = await createConversation(sessionId);
  await insertAnalyticsEvent('conversation_started', sessionId);

  return { conversation, isNewConversation: true };
}

async function extractConversationContext(messages: ConversationMessage[]) {
  const deterministicContext = deriveCollectedContext(messages);

  try {
    const extractedContext = await requestOpenAiContextExtraction({
      messages,
      supportedUseCases: [...SUPPORTED_USE_CASES],
    });

    return {
      collectedContext: mergeCollectedContext(deterministicContext, extractedContext),
      unsupportedRequest:
        extractedContext.unsupportedRequest && extractedContext.requestedUseCase
          ? extractedContext.requestedUseCase
          : undefined,
    };
  } catch {
    return {
      collectedContext: deterministicContext,
      unsupportedRequest: undefined,
    };
  }
}

export async function handleChatMessage(
  request: ChatApiRequest,
): Promise<ChatServiceResult> {
  const trimmedMessage = request.message.trim();

  if (!request.session_id.trim() || !trimmedMessage) {
    throw new Error('session_id and message are required.');
  }

  const { conversation } = await getOrCreateActiveConversation(request.session_id);

  await insertMessage(conversation.id, 'user', trimmedMessage);
  await insertAnalyticsEvent('message_sent', request.session_id, {
    conversation_id: conversation.id,
  });

  const priorMessages = await getConversationMessages(conversation.id);
  const currentMessages: ConversationMessage[] = priorMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
  const { collectedContext, unsupportedRequest } = await extractConversationContext(
    currentMessages,
  );

  if (
    unsupportedRequest ||
    (collectedContext.useCase && !isSupportedUseCase(collectedContext.useCase))
  ) {
    const requestedUseCase = unsupportedRequest ?? collectedContext.useCase;

    if (!requestedUseCase) {
      throw new Error('Unsupported request handling requires a requested use case.');
    }

    const reply = buildUnsupportedDomainReply(requestedUseCase);

    await insertMessage(conversation.id, 'assistant', reply);
    await insertAnalyticsEvent('message_received', request.session_id, {
      conversation_id: conversation.id,
      completion_reason: 'unsupported_domain',
    });

    return {
      reply,
      needsMoreInfo: true,
      collectedContext,
      completionReason: 'unsupported_domain',
    };
  }

  if (!hasMinimumRecommendationContext(collectedContext)) {
    const reply = buildFollowUpQuestion(collectedContext);

    await insertMessage(conversation.id, 'assistant', reply);
    await insertAnalyticsEvent('message_received', request.session_id, {
      conversation_id: conversation.id,
      completion_reason: 'needs_more_info',
    });

    return {
      reply,
      needsMoreInfo: true,
      collectedContext,
      completionReason: 'needs_more_info',
    };
  }

  const activeOffers = await getActiveOffers();

  if (activeOffers.length === 0) {
    const reply =
      'I do not have any active tools to recommend yet. Please add offers to the catalog first.';

    await insertMessage(conversation.id, 'assistant', reply);
    await insertAnalyticsEvent('message_received', request.session_id, {
      conversation_id: conversation.id,
      completion_reason: 'needs_more_info',
    });

    return {
      reply,
      needsMoreInfo: true,
      collectedContext,
      completionReason: 'needs_more_info',
    };
  }

  const fallbackRecommendations = buildFallbackRecommendations(
    collectedContext,
    activeOffers,
  );

  let reply = 'Here are the tools that best match what you told me.';
  let recommendations = fallbackRecommendations;
  let completionReason: ChatServiceResult['completionReason'] =
    'fallback_recommendation';

  try {
    const prompt = await loadActivePrompt();
    const providerOutput = await requestOpenAiRecommendations({
      prompt,
      context: collectedContext,
      messages: currentMessages,
      offers: activeOffers,
    });
    const normalizedRecommendations = validateProviderRecommendations(
      providerOutput,
      activeOffers,
    );

    if (!providerOutput.needsMoreInfo && normalizedRecommendations.length > 0) {
      recommendations = ensureRecommendationTarget(
        normalizedRecommendations,
        fallbackRecommendations,
      );
      reply = providerOutput.reply || reply;
      completionReason = 'llm_recommendation';
    }
  } catch {
    recommendations = fallbackRecommendations;
    completionReason = 'fallback_recommendation';
  }

  await insertMessage(conversation.id, 'assistant', reply);
  await saveRecommendations(conversation.id, recommendations);
  await markConversationRecommended(conversation.id);
  await insertAnalyticsEvent('message_received', request.session_id, {
    conversation_id: conversation.id,
    completion_reason: completionReason,
  });
  await insertAnalyticsEvent('recommendations_generated', request.session_id, {
    conversation_id: conversation.id,
    completion_reason: completionReason,
    recommendation_count: recommendations.length,
  });

  return {
    reply,
    needsMoreInfo: false,
    collectedContext,
    recommendations,
    completionReason,
  };
}