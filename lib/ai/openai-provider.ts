import { getRequiredEnv } from '@/lib/env';
import type {
  CollectedContext,
  ContextExtractionOutput,
  ConversationMessage,
  RecommendationOutput,
} from '@/types/chat';
import type { OfferRecord } from '@/types/database';

type OpenAiRecommendationParams = {
  prompt: string;
  context: CollectedContext;
  messages: ConversationMessage[];
  offers: OfferRecord[];
};

type OpenAiContextExtractionParams = {
  messages: ConversationMessage[];
  supportedUseCases: string[];
};

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function buildOfferSummary(offers: OfferRecord[]) {
  return offers
    .map((offer) => {
      return `${offer.id} | ${offer.name} | ${offer.category} | ${offer.pricing_model ?? 'unknown'} | ${offer.tags.join(', ')} | ${offer.description}`;
    })
    .join('\n');
}

export async function requestOpenAiRecommendations(
  params: OpenAiRecommendationParams,
): Promise<RecommendationOutput> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';
  const recentTranscript = params.messages
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${params.prompt}\n\nReturn valid JSON with keys: reply, needsMoreInfo, recommendations. recommendations must be an array of objects with offer_id, match_score, and match_reason.`,
        },
        {
          role: 'user',
          content: [
            `Collected context: ${JSON.stringify(params.context)}`,
            `Recent transcript:\n${recentTranscript}`,
            `Active offers:\n${buildOfferSummary(params.offers)}`,
          ].join('\n\n'),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return JSON.parse(content) as RecommendationOutput;
}

export async function requestOpenAiContextExtraction(
  params: OpenAiContextExtractionParams,
): Promise<ContextExtractionOutput> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';
  const transcript = params.messages
    .slice(-10)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Extract structured recommendation context from the transcript.',
            `Supported useCase values are only: ${params.supportedUseCases.join(', ')}.`,
            'If the user is clearly asking for a different software category, set unsupportedRequest to true and set requestedUseCase to the requested domain.',
            'Return valid JSON with keys: useCase, teamSize, budget, priorities, unsupportedRequest, requestedUseCase.',
            'Use null when a field is unknown. priorities must be an array of strings when present.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `Transcript:\n${transcript}`,
        },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  const parsed = JSON.parse(content) as Record<string, unknown>;

  return {
    useCase: typeof parsed.useCase === 'string' ? parsed.useCase.trim() || undefined : undefined,
    teamSize: typeof parsed.teamSize === 'string' ? parsed.teamSize.trim() || undefined : undefined,
    budget: typeof parsed.budget === 'string' ? parsed.budget.trim() || undefined : undefined,
    priorities: normalizeStringArray(parsed.priorities),
    unsupportedRequest: parsed.unsupportedRequest === true,
    requestedUseCase:
      typeof parsed.requestedUseCase === 'string'
        ? parsed.requestedUseCase.trim() || undefined
        : undefined,
  };
}