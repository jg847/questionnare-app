import { NextResponse } from 'next/server';

import { activateAdminQuestionnaire } from '@/lib/db/admin-questionnaires';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const result = await activateAdminQuestionnaire(params.id);

    if (!result) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    if (!result.questionnaire) {
      return NextResponse.json(
        {
          error: 'Questionnaire validation failed.',
          validation: result.validation,
        },
        { status: 400 },
      );
    }

    void Promise.resolve(
      insertAnalyticsEvent('questionnaire_activated', 'admin', {
        questionnaire_id: result.questionnaire.id,
        slug: result.questionnaire.slug,
        version: result.questionnaire.version,
      }),
    ).catch(() => undefined);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to activate questionnaire.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}