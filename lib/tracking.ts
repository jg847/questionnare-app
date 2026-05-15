import type { TrackClickRequest } from '@/types/chat';

export const TRACKING_UTM_SOURCE = 'toolmatch';
export const TRACKING_UTM_MEDIUM = 'recommendation';

export function generateSubId(
  sessionId: string,
  offerId: string,
  timestamp = Date.now(),
) {
  return `${sessionId}-${offerId}-${timestamp}`;
}

export function buildTrackedAffiliateUrl(
  affiliateUrl: string,
  sessionId: string,
  subId: string,
) {
  const url = new URL(affiliateUrl);

  url.searchParams.set('utm_source', TRACKING_UTM_SOURCE);
  url.searchParams.set('utm_medium', TRACKING_UTM_MEDIUM);
  url.searchParams.set('utm_campaign', sessionId);
  url.searchParams.set('sub_id', subId);

  return url.toString();
}

export function buildTrackClickPayload(
  offerId: string,
  sessionId: string,
  subId: string,
  recommendationId?: string,
  referrer?: string,
): TrackClickRequest {
  return {
    recommendation_id: recommendationId,
    offer_id: offerId,
    session_id: sessionId,
    sub_id: subId,
    utm_source: TRACKING_UTM_SOURCE,
    utm_medium: TRACKING_UTM_MEDIUM,
    utm_campaign: sessionId,
    referrer,
  };
}