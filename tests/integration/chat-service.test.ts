jest.mock('@/lib/db/chat-repository', () => ({
  createConversation: jest.fn(),
  getActiveOffers: jest.fn(),
  getConversationMessages: jest.fn(),
  getLatestConversationForSession: jest.fn(),
  insertAnalyticsEvent: jest.fn(),
  insertMessage: jest.fn(),
  markConversationRecommended: jest.fn(),
  saveRecommendations: jest.fn(),
}));

jest.mock('@/lib/ai/openai-provider', () => ({
  requestOpenAiContextExtraction: jest.fn(),
  requestOpenAiRecommendations: jest.fn(),
}));

jest.mock('@/lib/ai/prompt-loader', () => ({
  loadActivePrompt: jest.fn(),
}));

import { handleChatMessage } from '@/lib/ai/chat-service';
import {
  requestOpenAiContextExtraction,
  requestOpenAiRecommendations,
} from '@/lib/ai/openai-provider';
import { loadActivePrompt } from '@/lib/ai/prompt-loader';
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

const mockedCreateConversation = jest.mocked(createConversation);
const mockedGetActiveOffers = jest.mocked(getActiveOffers);
const mockedGetConversationMessages = jest.mocked(getConversationMessages);
const mockedGetLatestConversationForSession = jest.mocked(
  getLatestConversationForSession,
);
const mockedInsertAnalyticsEvent = jest.mocked(insertAnalyticsEvent);
const mockedInsertMessage = jest.mocked(insertMessage);
const mockedMarkConversationRecommended = jest.mocked(
  markConversationRecommended,
);
const mockedSaveRecommendations = jest.mocked(saveRecommendations);
const mockedRequestOpenAiRecommendations = jest.mocked(
  requestOpenAiRecommendations,
);
const mockedRequestOpenAiContextExtraction = jest.mocked(
  requestOpenAiContextExtraction,
);
const mockedLoadActivePrompt = jest.mocked(loadActivePrompt);

const activeOffers = [
  {
    id: 'offer-1',
    name: 'TaskFlow',
    slug: 'taskflow',
    description: 'Project management with collaboration and reporting.',
    category: 'project-management',
    tags: ['collaboration', 'reporting', 'planning'],
    affiliate_url: 'https://example.com/taskflow',
    logo_url: null,
    pricing_model: 'freemium',
    commission_info: null,
    is_active: true,
  },
  {
    id: 'offer-2',
    name: 'SprintBoard',
    slug: 'sprintboard',
    description: 'Project planning with strong collaboration features.',
    category: 'project-management',
    tags: ['collaboration', 'planning'],
    affiliate_url: 'https://example.com/sprintboard',
    logo_url: null,
    pricing_model: 'subscription',
    commission_info: null,
    is_active: true,
  },
  {
    id: 'offer-3',
    name: 'ClientBridge',
    slug: 'clientbridge',
    description: 'CRM for agencies and growing teams.',
    category: 'crm',
    tags: ['sales', 'reporting'],
    affiliate_url: 'https://example.com/clientbridge',
    logo_url: null,
    pricing_model: 'subscription',
    commission_info: null,
    is_active: true,
  },
  {
    id: 'offer-4',
    name: 'StudyNotes',
    slug: 'studynotes',
    description: 'Note-taking app for class notes and research organization.',
    category: 'note-taking',
    tags: ['notes', 'study', 'organization'],
    affiliate_url: 'https://example.com/studynotes',
    logo_url: null,
    pricing_model: 'freemium',
    commission_info: null,
    is_active: true,
  },
  {
    id: 'offer-5',
    name: 'WikiWorks',
    slug: 'wikiworks',
    description: 'Knowledge base for team documentation and searchable process notes.',
    category: 'knowledge-base',
    tags: ['docs', 'wiki', 'search'],
    affiliate_url: 'https://example.com/wikiworks',
    logo_url: null,
    pricing_model: 'subscription',
    commission_info: null,
    is_active: true,
  },
];

describe('handleChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetLatestConversationForSession.mockResolvedValue({
      id: 'conversation-1',
      session_id: 'session-1',
      recommendation_generated: false,
    });
    mockedCreateConversation.mockResolvedValue({
      id: 'conversation-1',
      session_id: 'session-1',
      recommendation_generated: false,
    });
    mockedInsertAnalyticsEvent.mockResolvedValue(undefined);
    mockedInsertMessage.mockResolvedValue(undefined);
    mockedSaveRecommendations.mockResolvedValue([]);
    mockedMarkConversationRecommended.mockResolvedValue(undefined);
    mockedLoadActivePrompt.mockResolvedValue('prompt');
    mockedGetActiveOffers.mockResolvedValue(activeOffers);
    mockedRequestOpenAiContextExtraction.mockRejectedValue(
      new Error('extractor unavailable'),
    );
  });

  it('asks a follow-up question when the context is incomplete', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'user',
        content: 'I need a CRM.',
      },
    ]);

    const result = await handleChatMessage({
      session_id: 'session-1',
      message: 'I need a CRM.',
    });

    expect(result.needsMoreInfo).toBe(true);
    expect(result.completionReason).toBe('needs_more_info');
    expect(result.reply).toMatch(/team|budget|matters most/i);
    expect(mockedSaveRecommendations).not.toHaveBeenCalled();
  });

  it('does not repeat the use-case question when the user answers with a short category', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'user',
        content: 'support',
      },
      {
        role: 'user',
        content: 'It is for a small team with a low budget.',
      },
    ]);

    const result = await handleChatMessage({
      session_id: 'session-1',
      message: 'It is for a small team with a low budget.',
    });

    expect(result.needsMoreInfo).toBe(false);
    expect(result.collectedContext).toMatchObject({
      useCase: 'support',
      teamSize: 'small_team',
      budget: 'low',
    });
    expect(result.recommendations).toHaveLength(5);
    expect(result.reply).not.toMatch(/what kind of software are you looking for/i);
  });

  it('returns a clear unsupported-domain reply instead of bluffing recommendations', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'assistant',
        content:
          'What kind of software are you looking for right now, such as project management, CRM, support, or automation?',
      },
      {
        role: 'user',
        content: 'accounting software for a small business',
      },
    ]);

    const result = await handleChatMessage({
      session_id: 'session-1',
      message: 'accounting software for a small business',
    });

    expect(result.needsMoreInfo).toBe(true);
    expect(result.completionReason).toBe('unsupported_domain');
    expect(result.reply).toMatch(/outside the current catalog/i);
    expect(result.reply).toMatch(/project management|crm|support|automation|note-taking/i);
    expect(mockedSaveRecommendations).not.toHaveBeenCalled();
  });

  it('treats note-taking as a supported category and recommends matching offers', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'assistant',
        content:
          'What kind of software are you looking for right now, such as project management, CRM, support, or automation?',
      },
      {
        role: 'user',
        content: 'note taking app for class',
      },
      {
        role: 'assistant',
        content: 'How big is the team that will use this tool?',
      },
      {
        role: 'user',
        content: 'Just me, and I need something free with good organization.',
      },
    ]);
    mockedRequestOpenAiRecommendations.mockRejectedValue(new Error('provider failed'));

    const result = await handleChatMessage({
      session_id: 'session-1',
      message: 'Just me, and I need something free with good organization.',
    });

    expect(result.needsMoreInfo).toBe(false);
    expect(result.completionReason).toBe('fallback_recommendation');
    expect(result.collectedContext).toMatchObject({
      useCase: 'note-taking',
      teamSize: 'solo',
    });
    expect(result.recommendations?.[0]).toMatchObject({
      offer_id: 'offer-4',
      name: 'StudyNotes',
    });
  });

  it('uses the extraction pass to avoid unnecessary follow-up loops', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'user',
        content: 'Need something for a growing sales team.',
      },
    ]);
    mockedRequestOpenAiContextExtraction.mockResolvedValue({
      useCase: 'crm',
      teamSize: 'small_team',
      budget: 'medium',
      priorities: ['reporting'],
      unsupportedRequest: false,
    });
    mockedRequestOpenAiRecommendations.mockRejectedValue(new Error('provider failed'));

    const result = await handleChatMessage({
      session_id: 'session-1',
      message: 'Need something for a growing sales team.',
    });

    expect(result.needsMoreInfo).toBe(false);
    expect(result.collectedContext).toMatchObject({
      useCase: 'crm',
      teamSize: 'small_team',
      budget: 'medium',
      priorities: ['reporting'],
    });
    expect(result.recommendations).toHaveLength(5);
  });

  it('falls back to deterministic recommendations when the provider fails', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'user',
        content:
          'I need project management software for a small team. Budget is under $50 and collaboration matters most.',
      },
    ]);
    mockedRequestOpenAiRecommendations.mockRejectedValue(new Error('provider failed'));

    const result = await handleChatMessage({
      session_id: 'session-1',
      message:
        'I need project management software for a small team. Budget is under $50 and collaboration matters most.',
    });

    expect(result.needsMoreInfo).toBe(false);
    expect(result.completionReason).toBe('fallback_recommendation');
    expect(result.recommendations).toHaveLength(5);
    expect(result.recommendations?.[0]).toMatchObject({
      offer_id: 'offer-1',
      name: 'TaskFlow',
      affiliate_url: 'https://example.com/taskflow',
    });
    expect(mockedSaveRecommendations).toHaveBeenCalledTimes(1);
    expect(mockedMarkConversationRecommended).toHaveBeenCalledTimes(1);
    expect(mockedInsertAnalyticsEvent).toHaveBeenCalledWith(
      'recommendations_generated',
      'session-1',
      expect.objectContaining({
        conversation_id: 'conversation-1',
        completion_reason: 'fallback_recommendation',
        recommendation_count: 5,
      }),
    );
  });

  it('uses provider recommendations and tops them up to the target count', async () => {
    mockedGetConversationMessages.mockResolvedValue([
      {
        role: 'user',
        content:
          'I need project management software for a small team. Budget is under $50 and collaboration plus reporting are priorities.',
      },
    ]);
    mockedRequestOpenAiRecommendations.mockResolvedValue({
      needsMoreInfo: false,
      reply: 'These are my best matches for your workflow.',
      recommendations: [
        {
          offer_id: 'offer-2',
          match_score: 91,
          match_reason: 'Strong collaboration fit.',
        },
      ],
    });

    const result = await handleChatMessage({
      session_id: 'session-1',
      message:
        'I need project management software for a small team. Budget is under $50 and collaboration plus reporting are priorities.',
    });

    expect(result.completionReason).toBe('llm_recommendation');
    expect(result.reply).toBe('These are my best matches for your workflow.');
    expect(result.recommendations).toHaveLength(5);
    expect(result.recommendations?.[0]).toMatchObject({
      offer_id: 'offer-2',
      name: 'SprintBoard',
      affiliate_url: 'https://example.com/sprintboard',
    });
    expect(result.recommendations?.[1].name).toBeDefined();
    expect(mockedInsertAnalyticsEvent).toHaveBeenCalledWith(
      'message_received',
      'session-1',
      expect.objectContaining({
        conversation_id: 'conversation-1',
        completion_reason: 'llm_recommendation',
      }),
    );
  });
});