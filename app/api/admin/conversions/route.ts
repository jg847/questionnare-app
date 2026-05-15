import { NextResponse } from 'next/server';

import {
  createAdminConversion,
  getAdminRevenue,
  resolveRevenueWindow,
} from '@/lib/db/admin-revenue';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';
import type { AdminConversionInput } from '@/types/admin';

function validateConversionInput(payload: unknown): { data?: AdminConversionInput; error?: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Invalid conversion input.' };
  }

  const input = payload as Record<string, unknown>;

  if (!['pending', 'approved', 'rejected', 'paid'].includes(String(input.status ?? ''))) {
    return { error: 'Conversion status is invalid.' };
  }

  if (typeof input.commission_value !== 'number') {
    return { error: 'commission_value is required.' };
  }

  if (typeof input.occurred_at !== 'string' || !input.occurred_at.trim()) {
    return { error: 'occurred_at is required.' };
  }

  return {
    data: {
      partner_id: typeof input.partner_id === 'string' ? input.partner_id : undefined,
      offer_id: typeof input.offer_id === 'string' ? input.offer_id : undefined,
      sub_id: typeof input.sub_id === 'string' ? input.sub_id : undefined,
      partner_conversion_id:
        typeof input.partner_conversion_id === 'string' ? input.partner_conversion_id : undefined,
      status: input.status as AdminConversionInput['status'],
      conversion_value:
        typeof input.conversion_value === 'number' ? input.conversion_value : undefined,
      commission_value: input.commission_value as number,
      currency: typeof input.currency === 'string' ? input.currency : 'USD',
      occurred_at: input.occurred_at as string,
      source_type: typeof input.source_type === 'string' ? input.source_type : undefined,
      source_payload:
        input.source_payload && typeof input.source_payload === 'object' && !Array.isArray(input.source_payload)
          ? (input.source_payload as Record<string, unknown>)
          : undefined,
      notes: typeof input.notes === 'string' ? input.notes : undefined,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const window = resolveRevenueWindow(searchParams.get('from'), searchParams.get('to'));
    const revenue = await getAdminRevenue(window);
    return NextResponse.json({ conversions: revenue.conversions, partnersCatalog: revenue.partnersCatalog, window });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load conversions.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validation = validateConversionInput(payload);

  if (!validation.data) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const conversion = await createAdminConversion(validation.data);

    void Promise.resolve(
      insertAnalyticsEvent('conversion_recorded', 'admin', {
        conversion_id: conversion.id,
        status: conversion.status,
        attribution_state: conversion.attribution_state,
      }),
    ).catch(() => undefined);

    if (['approved', 'paid'].includes(conversion.status)) {
      void Promise.resolve(
        insertAnalyticsEvent('revenue_recorded', 'admin', {
          conversion_id: conversion.id,
          commission_value: conversion.commission_value,
          currency: conversion.currency,
        }),
      ).catch(() => undefined);
    }

    return NextResponse.json({ conversion }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create conversion.';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}