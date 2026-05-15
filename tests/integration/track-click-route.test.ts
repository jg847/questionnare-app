/** @jest-environment node */

jest.mock('@/lib/db/chat-repository', () => ({
  getRecentClickForSessionAndOffer: jest.fn(),
  insertAnalyticsEvent: jest.fn(),
  insertClick: jest.fn(),
}));

import { POST } from '@/app/api/track/click/route';
import {
  getRecentClickForSessionAndOffer,
  insertAnalyticsEvent,
  insertClick,
} from '@/lib/db/chat-repository';

const mockedGetRecentClick = jest.mocked(getRecentClickForSessionAndOffer);
const mockedInsertAnalyticsEvent = jest.mocked(insertAnalyticsEvent);
const mockedInsertClick = jest.mocked(insertClick);

describe('POST /api/track/click', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists a valid click and emits analytics', async () => {
    mockedGetRecentClick.mockResolvedValue(null);
    mockedInsertClick.mockResolvedValue({
      id: 'click-1',
      recommendation_id: null,
      offer_id: 'offer-1',
      session_id: 'session-1',
      sub_id: 'session-1-offer-1-123',
      utm_source: 'toolmatch',
      utm_medium: 'recommendation',
      utm_campaign: 'session-1',
      referrer: 'http://localhost:3000',
      created_at: new Date().toISOString(),
    });

    const response = await POST(
      new Request('http://localhost:3000/api/track/click', {
        method: 'POST',
        body: JSON.stringify({
          offer_id: 'offer-1',
          session_id: 'session-1',
          sub_id: 'session-1-offer-1-123',
          utm_source: 'toolmatch',
          utm_medium: 'recommendation',
          utm_campaign: 'session-1',
          referrer: 'http://localhost:3000',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tracked: true });
    expect(mockedInsertClick).toHaveBeenCalledTimes(1);
    expect(mockedInsertAnalyticsEvent).toHaveBeenCalledWith(
      'recommendation_clicked',
      'session-1',
      expect.objectContaining({ offer_id: 'offer-1', click_id: 'click-1' }),
    );
  });

  it('deduplicates repeated clicks within the suppression window', async () => {
    mockedGetRecentClick.mockResolvedValue({
      id: 'click-1',
      recommendation_id: null,
      offer_id: 'offer-1',
      session_id: 'session-1',
      sub_id: 'session-1-offer-1-123',
      utm_source: 'toolmatch',
      utm_medium: 'recommendation',
      utm_campaign: 'session-1',
      referrer: null,
      created_at: new Date().toISOString(),
    });

    const response = await POST(
      new Request('http://localhost:3000/api/track/click', {
        method: 'POST',
        body: JSON.stringify({
          offer_id: 'offer-1',
          session_id: 'session-1',
          sub_id: 'session-1-offer-1-123',
          utm_source: 'toolmatch',
          utm_medium: 'recommendation',
          utm_campaign: 'session-1',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      tracked: false,
      deduplicated: true,
    });
    expect(mockedInsertClick).not.toHaveBeenCalled();
  });
});