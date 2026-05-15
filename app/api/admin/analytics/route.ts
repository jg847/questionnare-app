import { NextResponse } from 'next/server';

import { getAdminAnalytics, resolveAnalyticsWindow } from '@/lib/db/admin-analytics';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const window = resolveAnalyticsWindow(
      searchParams.get('from'),
      searchParams.get('to'),
    );
    const analytics = await getAdminAnalytics(window);

    return NextResponse.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load analytics.';
    const status = message === 'Invalid analytics date range.' || message === 'Analytics date range must have from <= to.'
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}