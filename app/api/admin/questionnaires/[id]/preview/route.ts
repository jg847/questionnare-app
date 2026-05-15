import { NextResponse } from 'next/server';

import { previewQuestionnaire } from '@/lib/db/admin-questionnaires';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const preview = await previewQuestionnaire(params.id);

    if (!preview) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to preview questionnaire.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}