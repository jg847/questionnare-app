import {
  buildTrackClickPayload,
  buildTrackedAffiliateUrl,
  generateSubId,
} from '@/lib/tracking';

describe('tracking helpers', () => {
  it('generates sub ids in the required format', () => {
    expect(generateSubId('session-1', 'offer-1', 1234567890)).toBe(
      'session-1-offer-1-1234567890',
    );
  });

  it('preserves affiliate parameters while appending required utm values and sub_id', () => {
    const result = buildTrackedAffiliateUrl(
      'https://example.com/product?existing=1&partner=abc',
      'session-1',
      'session-1-offer-1-123',
    );
    const url = new URL(result);

    expect(url.searchParams.get('existing')).toBe('1');
    expect(url.searchParams.get('partner')).toBe('abc');
    expect(url.searchParams.get('utm_source')).toBe('toolmatch');
    expect(url.searchParams.get('utm_medium')).toBe('recommendation');
    expect(url.searchParams.get('utm_campaign')).toBe('session-1');
    expect(url.searchParams.get('sub_id')).toBe('session-1-offer-1-123');
  });

  it('builds the click payload with the canonical sprint 04 contract', () => {
    expect(
      buildTrackClickPayload(
        'offer-1',
        'session-1',
        'session-1-offer-1-123',
        'recommendation-1',
        'http://localhost:3000',
      ),
    ).toEqual({
      recommendation_id: 'recommendation-1',
      offer_id: 'offer-1',
      session_id: 'session-1',
      sub_id: 'session-1-offer-1-123',
      utm_source: 'toolmatch',
      utm_medium: 'recommendation',
      utm_campaign: 'session-1',
      referrer: 'http://localhost:3000',
    });
  });
});