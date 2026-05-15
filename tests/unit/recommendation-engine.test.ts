import { buildFallbackRecommendations } from '@/lib/ai/recommendation-engine';

const offers = [
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
    name: 'PipeDrive Lite',
    slug: 'pipedrive-lite',
    description: 'CRM for sales teams that need pipeline visibility.',
    category: 'crm',
    tags: ['sales', 'pipeline', 'reporting'],
    affiliate_url: 'https://example.com/pipedrive-lite',
    logo_url: null,
    pricing_model: 'subscription',
    commission_info: null,
    is_active: true,
  },
  {
    id: 'offer-3',
    name: 'OpsBoard',
    slug: 'opsboard',
    description: 'Operations dashboard with automation support.',
    category: 'automation',
    tags: ['automation', 'integrations'],
    affiliate_url: 'https://example.com/opsboard',
    logo_url: null,
    pricing_model: 'subscription',
    commission_info: null,
    is_active: true,
  },
];

describe('buildFallbackRecommendations', () => {
  it('ranks the best matching offers first', () => {
    const recommendations = buildFallbackRecommendations(
      {
        useCase: 'project-management',
        teamSize: 'small_team',
        budget: 'low',
        priorities: ['collaboration', 'reporting'],
      },
      offers,
    );

    expect(recommendations[0]).toMatchObject({
      offer_id: 'offer-1',
      rank: 1,
      name: 'TaskFlow',
      affiliate_url: 'https://example.com/taskflow',
    });
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].match_score).toBe(100);
  });

  it('filters to exact category matches when a use case category is known', () => {
    const recommendations = buildFallbackRecommendations(
      {
        useCase: 'design',
        teamSize: 'small_team',
        budget: 'medium',
        priorities: ['collaboration', 'customization'],
      },
      [
        ...offers,
        {
          id: 'offer-4',
          name: 'DesignBoard',
          slug: 'designboard',
          description: 'Design collaboration and brand workflows for creative teams.',
          category: 'design',
          tags: ['collaboration', 'customization', 'prototyping'],
          affiliate_url: 'https://example.com/designboard',
          logo_url: null,
          pricing_model: 'subscription',
          commission_info: null,
          is_active: true,
        },
      ],
    );

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      offer_id: 'offer-4',
      name: 'DesignBoard',
      rank: 1,
    });
  });
});