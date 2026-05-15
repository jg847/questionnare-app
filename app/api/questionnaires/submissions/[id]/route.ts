import { NextResponse } from 'next/server';

import { advanceQuestionnaireSubmission } from '@/lib/db/admin-questionnaires';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let payload: { question_id?: string; value?: unknown };

  try {
    payload = (await request.json()) as { question_id?: string; value?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!payload.question_id?.trim()) {
    return NextResponse.json({ error: 'question_id is required.' }, { status: 400 });
  }

  try {
    const result = await advanceQuestionnaireSubmission({
      submissionId: params.id,
      questionId: payload.question_id.trim(),
      value: payload.value,
    });

    if (!result) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update questionnaire submission.';
    const status = message.includes('require') || message.includes('invalid') || message.includes('not found')
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}