import { NextResponse } from 'next/server';

import { validateAdminQuestionnaire } from '@/lib/db/admin-questionnaires';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const validation = await validateAdminQuestionnaire(params.id);

    if (!validation) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    return NextResponse.json({ validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate questionnaire.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}