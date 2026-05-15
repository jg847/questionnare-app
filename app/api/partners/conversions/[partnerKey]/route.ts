import { NextResponse } from 'next/server';

import { ingestPartnerConversion } from '@/lib/db/admin-revenue';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';
import type { AdminConversionInput } from '@/types/admin';

export async function POST(
  request: Request,
  { params }: { params: { partnerKey: string } },
) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof payload.commission_value !== 'number' || typeof payload.occurred_at !== 'string') {
    return NextResponse.json(
      { error: 'commission_value and occurred_at are required.' },
      { status: 400 },
    );
  }

  try {
    const conversion = await ingestPartnerConversion(
      params.partnerKey,
      {
        partner_conversion_id:
          typeof payload.partner_conversion_id === 'string' ? payload.partner_conversion_id : undefined,
        offer_id: typeof payload.offer_id === 'string' ? payload.offer_id : undefined,
        sub_id: typeof payload.sub_id === 'string' ? payload.sub_id : undefined,
        status:
          (payload.status as AdminConversionInput['status']) ?? 'pending',
        conversion_value:
          typeof payload.conversion_value === 'number' ? payload.conversion_value : undefined,
        commission_value: payload.commission_value as number,
        currency: typeof payload.currency === 'string' ? payload.currency : 'USD',
        occurred_at: payload.occurred_at,
        notes: typeof payload.notes === 'string' ? payload.notes : undefined,
      },
      payload,
    );

    void Promise.resolve(
      insertAnalyticsEvent('conversion_recorded', 'partner-webhook', {
        conversion_id: conversion.id,
        partner_conversion_id: conversion.partner_conversion_id,
        attribution_state: conversion.attribution_state,
      }),
    ).catch(() => undefined);

    return NextResponse.json({ conversion }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to ingest partner conversion.';
    const status = message.includes('Partner not found') ? 404 : message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}