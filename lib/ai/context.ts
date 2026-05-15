import {
  PRIORITY_KEYWORDS,
  SUPPORTED_USE_CASE_LABELS,
  SUPPORTED_USE_CASES,
  USE_CASE_KEYWORDS,
} from '@/lib/ai/constants';
import type {
  CollectedContext,
  ContextExtractionOutput,
  ConversationMessage,
  SupportedUseCase,
} from '@/types/chat';

type FollowUpSlot = 'useCase' | 'teamSize' | 'budget' | 'priorities';

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function uniquePriorities(priorities: string[]) {
  return Array.from(new Set(priorities));
}

function normalizeUseCasePhrase(value: string) {
  return value
    .trim()
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/^(?:good|best|some)\s+/i, '')
    .replace(/\s+(?:for|that|to)\s+.+$/i, '')
    .replace(/software|tool|tools|platform|app|apps/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 120);
}

function normalizeUseCaseCategory(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function isSupportedUseCase(value?: string): value is SupportedUseCase {
  return Boolean(value && SUPPORTED_USE_CASES.includes(value as SupportedUseCase));
}

export function getSupportedUseCaseLabels() {
  return SUPPORTED_USE_CASES.map((useCase) => SUPPORTED_USE_CASE_LABELS[useCase]);
}

function sanitizePriorities(priorities: string[], useCase?: string) {
  if (!useCase) {
    return uniquePriorities(priorities);
  }

  const normalizedUseCase = useCase.replace(/-/g, ' ');

  return uniquePriorities(
    priorities.filter((priority) => priority.toLowerCase() !== normalizedUseCase),
  );
}

function detectFollowUpSlot(message: string): FollowUpSlot | undefined {
  const text = normalizeText(message);

  if (text.includes('what kind of software are you looking for')) {
    return 'useCase';
  }

  if (text.includes('how big is the team')) {
    return 'teamSize';
  }

  if (text.includes('free or low-cost option') || text.includes('budget for a paid tool')) {
    return 'budget';
  }

  if (text.includes('what matters most') || text.includes('one more thing that matters')) {
    return 'priorities';
  }

  return undefined;
}

function extractUseCase(text: string) {
  for (const entry of USE_CASE_KEYWORDS) {
    for (const phrase of entry.phrases) {
      if (text.includes(phrase)) {
        return entry.category;
      }
    }
  }

  const forMatch = text.match(
    /(?:need|looking for|look for|want|building|shopping for|recommend|recommend me)\s+(?:a|an)?\s*(.+?)(?:\?|$)/i,
  );

  if (forMatch?.[1]) {
    const normalized = normalizeUseCasePhrase(forMatch[1]);
    return normalized ? normalizeUseCaseCategory(normalized) : undefined;
  }

  const shortAnswerMatch = text.match(/^(project management|crm|support|automation)$/i);

  if (shortAnswerMatch?.[1]) {
    return shortAnswerMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
  }

  return undefined;
}

function extractTeamSize(text: string) {
  if (/(just me|solo|only me|myself)/i.test(text)) {
    return 'solo';
  }

  if (/(small team|1-5|2-10|5 people|10 people)/i.test(text)) {
    return 'small_team';
  }

  if (/(10-50|20 people|mid-size|growing team)/i.test(text)) {
    return 'mid_size_team';
  }

  if (/(50\+|100\+|enterprise|large team|large company)/i.test(text)) {
    return 'enterprise';
  }

  return undefined;
}

function extractBudget(text: string) {
  if (/(free|cheap|low budget|budget-friendly|under \$?50)/i.test(text)) {
    return 'low';
  }

  if (/(mid budget|under \$?200|reasonable budget)/i.test(text)) {
    return 'medium';
  }

  if (/(premium|enterprise budget|high budget|under \$?1000)/i.test(text)) {
    return 'high';
  }

  return undefined;
}

function extractPriorities(text: string) {
  return PRIORITY_KEYWORDS.filter((keyword) => text.includes(keyword));
}

function extractPriorityAnswer(text: string) {
  const keywordMatches = extractPriorities(text);

  if (keywordMatches.length > 0) {
    return keywordMatches;
  }

  return text
    .split(/,|\/|\band\b|\bor\b/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part.replace(/^(?:it should be|it needs|needs|need|want|something)\s+/i, '').trim(),
    )
    .filter((part) => part.length > 2 && part.length <= 40)
    .slice(0, 4);
}

function extractUseCaseAnswer(text: string) {
  const extracted = extractUseCase(text);

  if (extracted) {
    return extracted;
  }

  if (/^(not sure|anything|something|whatever)$/i.test(text)) {
    return undefined;
  }

  const normalized = normalizeUseCasePhrase(text);
  return normalized ? normalizeUseCaseCategory(normalized) : undefined;
}

function extractSlotContext(slot: FollowUpSlot | undefined, text: string): CollectedContext {
  if (!slot) {
    return {};
  }

  if (slot === 'useCase') {
    return {
      useCase: extractUseCaseAnswer(text),
    };
  }

  if (slot === 'teamSize') {
    return {
      teamSize: extractTeamSize(text),
    };
  }

  if (slot === 'budget') {
    return {
      budget: extractBudget(text),
    };
  }

  return {
    priorities: extractPriorityAnswer(text),
  };
}

export function deriveCollectedContext(messages: ConversationMessage[]): CollectedContext {
  let context: CollectedContext = {};
  let pendingSlot: FollowUpSlot | undefined;

  for (const message of messages) {
    if (message.role === 'assistant') {
      pendingSlot = detectFollowUpSlot(message.content);
      continue;
    }

    const text = normalizeText(message.content);
    const slotContext = extractSlotContext(pendingSlot, text);
    const useCase = context.useCase ?? slotContext.useCase ?? extractUseCase(text);

    context = {
      useCase,
      teamSize: context.teamSize ?? slotContext.teamSize ?? extractTeamSize(text),
      budget: context.budget ?? slotContext.budget ?? extractBudget(text),
      priorities: sanitizePriorities(
        [
          ...(context.priorities ?? []),
          ...(slotContext.priorities ?? []),
          ...extractPriorities(text),
        ],
        useCase,
      ),
    };
    pendingSlot = undefined;
  }

  return context;
}

export function mergeCollectedContext(
  base: CollectedContext,
  extracted?: ContextExtractionOutput | null,
) {
  if (!extracted) {
    return base;
  }

  const useCase = extracted.useCase ?? base.useCase;

  return {
    useCase,
    teamSize: extracted.teamSize ?? base.teamSize,
    budget: extracted.budget ?? base.budget,
    priorities: sanitizePriorities(
      [...(base.priorities ?? []), ...(extracted.priorities ?? [])],
      useCase,
    ),
  };
}

export function hasMinimumRecommendationContext(context: CollectedContext) {
  const supportingDimensions = [
    context.teamSize ? 1 : 0,
    context.budget ? 1 : 0,
    context.priorities && context.priorities.length > 0 ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  return Boolean(context.useCase) && supportingDimensions >= 2;
}

export function buildFollowUpQuestion(context: CollectedContext) {
  if (!context.useCase) {
    return 'What kind of software are you looking for right now, such as project management, CRM, support, or automation?';
  }

  if (!context.teamSize) {
    return `Got it${isSupportedUseCase(context.useCase) ? `, ${SUPPORTED_USE_CASE_LABELS[context.useCase]}` : ''}. How big is the team that will use this tool?`;
  }

  if (!context.budget) {
    return 'Do you need a free or low-cost option, or do you have budget for a paid tool?';
  }

  if (!context.priorities || context.priorities.length === 0) {
    return 'What matters most here: ease of use, collaboration, automation, integrations, price, or reporting?';
  }

  return 'Tell me one more thing that matters for this decision so I can narrow the recommendation down.';
}

export function buildUnsupportedDomainReply(requestedUseCase: string) {
  const supportedCategories = getSupportedUseCaseLabels().join(', ');

  return `I can help best with ${supportedCategories} software right now. "${requestedUseCase}" is outside the current catalog, so I do not want to bluff a recommendation. If you want, tell me whether your need is closer to project management, CRM, support, or automation and I will narrow it down.`;
}