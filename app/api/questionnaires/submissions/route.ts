import { NextResponse } from 'next/server';

import { createQuestionnaireSubmission } from '@/lib/db/admin-questionnaires';

export async function POST(request: Request) {
  let payload: { session_id?: string; category?: string };

  try {
    payload = (await request.json()) as { session_id?: string; category?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!payload.session_id?.trim()) {
    return NextResponse.json({ error: 'session_id is required.' }, { status: 400 });
  }

  try {
    const result = await createQuestionnaireSubmission(
      payload.session_id.trim(),
      payload.category?.trim() || undefined,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start questionnaire.';
    const status = message.includes('No active questionnaire') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}