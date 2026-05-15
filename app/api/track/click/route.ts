import { NextResponse } from 'next/server';

import {
  getRecentClickForSessionAndOffer,
  insertAnalyticsEvent,
  insertClick,
} from '@/lib/db/chat-repository';
import type { TrackClickRequest, TrackClickResponse } from '@/types/chat';

const CLICK_DEDUP_WINDOW_MS = 5000;

function isValidTrackClickPayload(
  payload: Partial<TrackClickRequest> | undefined,
): payload is TrackClickRequest {
  return Boolean(
    payload?.offer_id?.trim() &&
      payload.session_id?.trim() &&
      payload.sub_id?.trim() &&
      payload.utm_source === 'toolmatch' &&
      payload.utm_medium === 'recommendation' &&
      payload.utm_campaign?.trim(),
  );
}

export async function POST(request: Request) {
  let payload: Partial<TrackClickRequest>;

  try {
    payload = (await request.json()) as Partial<TrackClickRequest>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidTrackClickPayload(payload)) {
    return NextResponse.json({ error: 'Invalid tracking payload.' }, { status: 400 });
  }

  try {
    const recentClick = await getRecentClickForSessionAndOffer(
      payload.session_id,
      payload.offer_id,
      new Date(Date.now() - CLICK_DEDUP_WINDOW_MS).toISOString(),
    );

    if (recentClick) {
      const deduplicatedResponse: TrackClickResponse = {
        tracked: false,
        deduplicated: true,
      };

      return NextResponse.json(deduplicatedResponse);
    }

    const click = await insertClick(payload);
    await insertAnalyticsEvent('recommendation_clicked', payload.session_id, {
      click_id: click.id,
      offer_id: payload.offer_id,
      recommendation_id: payload.recommendation_id ?? null,
      sub_id: payload.sub_id,
    });

    const successResponse: TrackClickResponse = {
      tracked: true,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Click tracking failed.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}