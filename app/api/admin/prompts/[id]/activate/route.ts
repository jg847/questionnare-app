import { NextResponse } from 'next/server';

import { activateAdminPrompt } from '@/lib/db/admin-prompts';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const prompt = await activateAdminPrompt(params.id);
    return NextResponse.json({ prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to activate prompt.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}