import { NextResponse } from 'next/server';

import {
  createAdminQuestionnaire,
  listAdminQuestionnaires,
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
  const status = message.includes('Database migration required') ? 503 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const questionnaires = await listAdminQuestionnaires();
    return NextResponse.json({ questionnaires });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questionnaires.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const questionnaire = await createAdminQuestionnaire(validation.data);

    if (!questionnaire) {
      throw new Error('Questionnaire could not be created.');
    }

    void Promise.resolve(
      insertAnalyticsEvent('questionnaire_created', 'admin', {
        questionnaire_id: questionnaire.id,
        slug: questionnaire.slug,
        name: questionnaire.name,
      }),
    ).catch(() => undefined);

    return NextResponse.json({ questionnaire }, { status: 201 });
  } catch (error) {
    return handleMutationError(error);
  }
}