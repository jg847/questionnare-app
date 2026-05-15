import { NextResponse } from 'next/server';

import { getAdminRevenue, resolveRevenueWindow } from '@/lib/db/admin-revenue';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const window = resolveRevenueWindow(searchParams.get('from'), searchParams.get('to'));
    const revenue = await getAdminRevenue(window);
    return NextResponse.json(revenue);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load revenue analytics.';
    const status = message.includes('Invalid analytics date range') || message.includes('from <= to')
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}