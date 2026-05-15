import { buildAdminAnalyticsResponse, resolveAnalyticsWindow } from '@/lib/db/admin-analytics';

describe('admin analytics aggregation', () => {
  it('builds deterministic summary, offer metrics, and activity points', () => {
    const result = buildAdminAnalyticsResponse({
      window: {
        from: '2026-05-12T00:00:00.000Z',
        to: '2026-05-14T23:59:59.999Z',
      },
      conversations: [
        {
          id: 'conversation-1',
          session_id: 'session-1',
          created_at: '2026-05-12T10:00:00.000Z',
          recommendation_generated: true,
        },
        {
          id: 'conversation-2',
          session_id: 'session-2',
          created_at: '2026-05-13T10:00:00.000Z',
          recommendation_generated: false,
        },
      ],
      recommendations: [
        { offer_id: 'offer-1', created_at: '2026-05-12T10:10:00.000Z' },
        { offer_id: 'offer-1', created_at: '2026-05-12T10:11:00.000Z' },
        { offer_id: 'offer-2', created_at: '2026-05-13T10:11:00.000Z' },
      ],
      clicks: [
        { offer_id: 'offer-1', session_id: 'session-1', created_at: '2026-05-12T10:12:00.000Z' },
        { offer_id: 'offer-2', session_id: 'session-3', created_at: '2026-05-13T10:12:00.000Z' },
      ],
      offers: [
        { id: 'offer-1', name: 'TaskFlow' },
        { id: 'offer-2', name: 'BudgetBoard' },
      ],
    });

    expect(result.summary.totalConversations).toBe(2);
    expect(result.summary.recommendationGenerationRate).toBe(0.5);
    expect(result.summary.totalClicks).toBe(2);
    expect(result.summary.funnel.recommendationClicks).toBe(2);
    expect(result.offers).toEqual([
      expect.objectContaining({
        offer_id: 'offer-2',
        clicks: 1,
        recommendations: 1,
        ctr: 1,
      }),
      expect.objectContaining({
        offer_id: 'offer-1',
        clicks: 1,
        recommendations: 2,
        ctr: 0.5,
      }),
    ]);
    expect(result.topOffersByClicks).toEqual([
      expect.objectContaining({ offer_id: 'offer-2', clicks: 1 }),
      expect.objectContaining({ offer_id: 'offer-1', clicks: 1 }),
    ]);
    expect(result.activity).toHaveLength(3);
  });

  it('rejects invalid windows and bad ordering', () => {
    expect(() => resolveAnalyticsWindow('bad-date', null)).toThrow(
      'Invalid analytics date range.',
    );
    expect(() =>
      resolveAnalyticsWindow('2026-05-14', '2026-05-01'),
    ).toThrow('Analytics date range must have from <= to.');
  });
});