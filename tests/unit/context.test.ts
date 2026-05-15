import {
  buildUnsupportedDomainReply,
  buildFollowUpQuestion,
  deriveCollectedContext,
  getSupportedUseCaseLabels,
  hasMinimumRecommendationContext,
  mergeCollectedContext,
} from '@/lib/ai/context';

describe('context helpers', () => {
  it('derives recommendation context from prior user messages', () => {
    const context = deriveCollectedContext([
      {
        role: 'user',
        content:
          'I need a project management tool for a small team. Budget is under $50 and ease of use matters most.',
      },
    ]);

    expect(context).toEqual({
      useCase: 'project-management',
      teamSize: 'small_team',
      budget: 'low',
      priorities: ['ease of use'],
    });
    expect(hasMinimumRecommendationContext(context)).toBe(true);
  });

  it('recognizes short category answers after a follow-up question', () => {
    const context = deriveCollectedContext([
      {
        role: 'user',
        content: 'support',
      },
      {
        role: 'user',
        content: 'It is for a small team and budget is under $50.',
      },
    ]);

    expect(context).toEqual({
      useCase: 'support',
      teamSize: 'small_team',
      budget: 'low',
      priorities: [],
    });
  });

  it('recognizes broader looking-for phrasing instead of repeating the same question', () => {
    const context = deriveCollectedContext([
      {
        role: 'user',
        content: 'I am looking for automation software for a small team with integrations and a low budget.',
      },
    ]);

    expect(context).toEqual({
      useCase: 'automation',
      teamSize: 'small_team',
      budget: 'low',
      priorities: ['integrations'],
    });
    expect(hasMinimumRecommendationContext(context)).toBe(true);
  });

  it('uses the last assistant question to interpret a direct use-case answer', () => {
    const context = deriveCollectedContext([
      {
        role: 'assistant',
        content:
          'What kind of software are you looking for right now, such as project management, CRM, support, or automation?',
      },
      {
        role: 'user',
        content: 'note taking app for class',
      },
    ]);

    expect(context).toEqual({
      useCase: 'note-taking',
      priorities: [],
    });
  });

  it('merges extracted context over deterministic fallback safely', () => {
    const merged = mergeCollectedContext(
      {
        useCase: 'crm',
        priorities: ['support'],
      },
      {
        useCase: 'support',
        teamSize: 'small_team',
        budget: 'low',
        priorities: ['ease of use'],
      },
    );

    expect(merged).toEqual({
      useCase: 'support',
      teamSize: 'small_team',
      budget: 'low',
      priorities: ['ease of use'],
    });
  });

  it('builds an unsupported-domain reply that redirects to supported categories', () => {
    const supportedLabels = getSupportedUseCaseLabels();
    const reply = buildUnsupportedDomainReply('accounting');

    expect(reply).toMatch(/outside the current catalog/i);
    expect(reply).toContain('accounting');
    expect(reply).toContain(supportedLabels[0]);
  });

  it('asks for the next missing dimension when context is incomplete', () => {
    const question = buildFollowUpQuestion({
      useCase: 'crm',
      budget: 'medium',
    });

    expect(question).toMatch(/how big is the team/i);
  });
});