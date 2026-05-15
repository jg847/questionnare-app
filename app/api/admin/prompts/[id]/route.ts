import { NextResponse } from 'next/server';

import { getAdminPromptById } from '@/lib/db/admin-prompts';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const prompt = await getAdminPromptById(params.id);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found.' }, { status: 404 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load prompt.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}