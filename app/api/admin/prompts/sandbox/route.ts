import { NextResponse } from 'next/server';

import { runPromptSandbox } from '@/lib/ai/prompt-sandbox';
import type { AdminPromptSandboxRequest } from '@/types/admin';

export async function POST(request: Request) {
  let payload: AdminPromptSandboxRequest;

  try {
    payload = (await request.json()) as AdminPromptSandboxRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!payload.content?.trim()) {
    return NextResponse.json({ error: 'Prompt content is required.' }, { status: 400 });
  }

  if (!Array.isArray(payload.sampleConversation) || payload.sampleConversation.length === 0) {
    return NextResponse.json(
      { error: 'At least one sample conversation message is required.' },
      { status: 400 },
    );
  }

  try {
    const result = await runPromptSandbox({
      ...payload,
      content: payload.content.trim(),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sandbox failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}