/** @jest-environment node */

jest.mock('@/lib/db/admin-analytics', () => ({
  getAdminAnalytics: jest.fn(),
  resolveAnalyticsWindow: jest.fn(),
}));

import { GET as analyticsGet } from '@/app/api/admin/analytics/route';
import { getAdminAnalytics, resolveAnalyticsWindow } from '@/lib/db/admin-analytics';

const mockedGetAdminAnalytics = jest.mocked(getAdminAnalytics);
const mockedResolveAnalyticsWindow = jest.mocked(resolveAnalyticsWindow);

describe('admin analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns analytics for a resolved date window', async () => {
    mockedResolveAnalyticsWindow.mockReturnValue({
      from: '2026-04-15T00:00:00.000Z',
      to: '2026-05-14T23:59:59.999Z',
    });
    mockedGetAdminAnalytics.mockResolvedValue({
      summary: {
        totalConversations: 10,
        recommendationGenerationRate: 0.8,
        totalClicks: 5,
        metricDefinitions: {
          totalConversations: 'count(conversations.created_at in window)',
          recommendationGenerationRate:
            'count(conversations where recommendation_generated = true in window) / count(conversations in window)',
          ctrPerOffer:
            'clicks for that offer in the window / recommendations for that offer in the window',
          funnel:
            'conversations started, conversations with recommendations, sessions with at least one recommendation click',
        },
        topClickedOffer: { offer_id: 'offer-1', name: 'TaskFlow', clicks: 3 },
        funnel: {
          conversationsStarted: 10,
          recommendationsGenerated: 8,
          recommendationClicks: 4,
        },
      },
      offers: [],
      topOffersByClicks: [],
      activity: [],
      window: {
        from: '2026-04-15T00:00:00.000Z',
        to: '2026-05-14T23:59:59.999Z',
      },
    });

    const response = await analyticsGet(new Request('http://localhost/api/admin/analytics'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      summary: expect.objectContaining({ totalConversations: 10 }),
    });
  });

  it('rejects invalid date ranges safely', async () => {
    mockedResolveAnalyticsWindow.mockImplementation(() => {
      throw new Error('Invalid analytics date range.');
    });

    const response = await analyticsGet(
      new Request('http://localhost/api/admin/analytics?from=bad&to=worse'),
    );

    expect(response.status).toBe(400);
  });
});