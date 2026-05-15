import { NextResponse } from 'next/server';

import { updateAdminConversion } from '@/lib/db/admin-revenue';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';
import type { AdminConversionInput } from '@/types/admin';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let payload: Partial<AdminConversionInput>;

  try {
    payload = (await request.json()) as Partial<AdminConversionInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const conversion = await updateAdminConversion(params.id, payload);

    if (!conversion) {
      return NextResponse.json({ error: 'Conversion not found.' }, { status: 404 });
    }

    void Promise.resolve(
      insertAnalyticsEvent(
        ['approved', 'paid'].includes(conversion.status)
          ? 'conversion_approved'
          : 'conversion_recorded',
        'admin',
        {
          conversion_id: conversion.id,
          status: conversion.status,
          attribution_state: conversion.attribution_state,
        },
      ),
    ).catch(() => undefined);

    return NextResponse.json({ conversion });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update conversion.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}