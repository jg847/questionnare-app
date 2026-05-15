import { NextResponse } from 'next/server';

import { getRevenuePartners, resolveRevenueWindow } from '@/lib/db/admin-revenue';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const window = resolveRevenueWindow(searchParams.get('from'), searchParams.get('to'));
    const partners = await getRevenuePartners(window);
    return NextResponse.json({ partners, window });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load revenue partners.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}