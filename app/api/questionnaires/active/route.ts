import { NextResponse } from 'next/server';

import { getPublicActiveQuestionnaire } from '@/lib/db/admin-questionnaires';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.trim() || undefined;
    const questionnaire = await getPublicActiveQuestionnaire(category);

    if (!questionnaire) {
      return NextResponse.json({ questionnaire: null }, { status: 200 });
    }

    return NextResponse.json({ questionnaire });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questionnaire.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}