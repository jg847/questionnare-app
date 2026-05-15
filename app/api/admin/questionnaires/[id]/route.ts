import { NextResponse } from 'next/server';

import {
  getAdminQuestionnaireById,
  updateAdminQuestionnaire,
} from '@/lib/db/admin-questionnaires';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';
import { validateAdminQuestionnaireInput } from '@/lib/questionnaire/runtime';

function handleMutationError(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  ) {
    return NextResponse.json(
      {
        error: 'A questionnaire with that slug already exists.',
        fieldErrors: { slug: 'Slug must be unique.' },
      },
      { status: 409 },
    );
  }

  const message = error instanceof Error ? error.message : 'Questionnaire request failed.';
  const status = message.includes('immutable') ? 409 : message.includes('Database migration required') ? 503 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const questionnaire = await getAdminQuestionnaireById(params.id);

    if (!questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    return NextResponse.json({ questionnaire });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questionnaire.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validation = validateAdminQuestionnaireInput(payload);

  if (!validation.data) {
    return NextResponse.json(
      { error: 'Invalid questionnaire input.', fieldErrors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const questionnaire = await updateAdminQuestionnaire(params.id, validation.data);

    if (!questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    void Promise.resolve(
      insertAnalyticsEvent('questionnaire_updated', 'admin', {
        questionnaire_id: questionnaire.id,
        slug: questionnaire.slug,
        name: questionnaire.name,
      }),
    ).catch(() => undefined);

    return NextResponse.json({ questionnaire });
  } catch (error) {
    return handleMutationError(error);
  }
}