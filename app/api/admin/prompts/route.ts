import { NextResponse } from 'next/server';

import { createAdminPrompt, getActiveAdminPrompt, listAdminPrompts } from '@/lib/db/admin-prompts';
import type { AdminPromptCreateInput } from '@/types/admin';

export async function GET() {
  try {
    const [activePrompt, prompts] = await Promise.all([
      getActiveAdminPrompt(),
      listAdminPrompts(),
    ]);

    return NextResponse.json({ activePrompt, prompts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load prompts.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: AdminPromptCreateInput;

  try {
    payload = (await request.json()) as AdminPromptCreateInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!payload.content?.trim()) {
    return NextResponse.json({ error: 'Prompt content is required.' }, { status: 400 });
  }

  try {
    const prompt = await createAdminPrompt({
      content: payload.content.trim(),
      activate: payload.activate,
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create prompt.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}