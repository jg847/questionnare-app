import {
  buildFollowUpQuestion,
  deriveCollectedContext,
  hasMinimumRecommendationContext,
} from '@/lib/ai/context';
import { requestOpenAiRecommendations } from '@/lib/ai/openai-provider';
import { buildFallbackRecommendations } from '@/lib/ai/recommendation-engine';
import { getActiveOffers } from '@/lib/db/chat-repository';
import type {
  AdminPromptSandboxRequest,
  AdminPromptSandboxResponse,
} from '@/types/admin';
import type { ConversationMessage } from '@/types/chat';

export async function runPromptSandbox(
  request: AdminPromptSandboxRequest,
): Promise<AdminPromptSandboxResponse> {
  const activeOffers = await getActiveOffers();
  const messages: ConversationMessage[] = request.sampleConversation.map((message) => ({
    role: message.role,
    content: message.content,
  }));
  const derivedContext = deriveCollectedContext(messages);
  const context = {
    ...derivedContext,
    ...request.sampleContext,
  };

  if (!hasMinimumRecommendationContext(context)) {
    return {
      reply: buildFollowUpQuestion(context),
      needsMoreInfo: true,
    };
  }

  if (activeOffers.length === 0) {
    return {
      reply: 'No active offers are available for sandbox testing yet.',
      needsMoreInfo: true,
    };
  }

  const fallbackRecommendations = buildFallbackRecommendations(context, activeOffers).map(
    (recommendation) => ({
      offer_id: recommendation.offer_id,
      rank: recommendation.rank,
      match_score: recommendation.match_score,
      match_reason: recommendation.match_reason,
      name: recommendation.name,
    }),
  );

  try {
    const providerOutput = await requestOpenAiRecommendations({
      prompt: request.content,
      context,
      messages,
      offers: activeOffers,
    });

    if (providerOutput.needsMoreInfo) {
      return {
        reply: providerOutput.reply,
        needsMoreInfo: true,
      };
    }

    const normalizedRecommendations = (providerOutput.recommendations ?? [])
      .map((recommendation, index) => ({
        offer_id: recommendation.offer_id,
        rank: index + 1,
        match_score: Math.round(recommendation.match_score),
        match_reason: recommendation.match_reason,
        name: activeOffers.find((offer) => offer.id === recommendation.offer_id)?.name,
      }))
      .filter((recommendation) => recommendation.name)
      .slice(0, 5);

    return {
      reply: providerOutput.reply,
      needsMoreInfo: false,
      recommendations:
        normalizedRecommendations.length > 0
          ? normalizedRecommendations
          : fallbackRecommendations,
    };
  } catch {
    return {
      reply: 'Sandbox used fallback recommendation mode because the live provider was unavailable.',
      needsMoreInfo: false,
      recommendations: fallbackRecommendations,
    };
  }
}