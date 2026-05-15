import { NextResponse } from 'next/server';

import { getRevenueOffers, resolveRevenueWindow } from '@/lib/db/admin-revenue';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const window = resolveRevenueWindow(searchParams.get('from'), searchParams.get('to'));
    const offers = await getRevenueOffers(window);
    return NextResponse.json({ offers, window });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load revenue offers.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}