import { NextResponse } from 'next/server';

import { handleChatMessage } from '@/lib/ai/chat-service';
import type { ChatApiRequest } from '@/types/chat';

const STREAM_CONTENT_TYPE = 'application/x-ndjson; charset=utf-8';

function wantsStreamingResponse(request: Request) {
  return (
    request.headers.get('accept')?.includes('application/x-ndjson') === true
  );
}

function createReplyChunks(reply: string) {
  const segments = reply.match(/.{1,48}(?:\s|$)|.{1,48}/g);
  return segments?.length ? segments : [reply];
}

function streamChatResult(result: Awaited<ReturnType<typeof handleChatMessage>>) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        let accumulatedReply = '';

        for (const segment of createReplyChunks(result.reply)) {
          accumulatedReply += segment;
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({ type: 'reply_delta', reply: accumulatedReply })}\n`,
            ),
          );
        }

        if (result.recommendations?.length) {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: 'recommendations',
                recommendations: result.recommendations,
              })}\n`,
            ),
          );
        }

        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: 'done' })}\n`),
        );
        controller.close();
      },
    }),
    {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': STREAM_CONTENT_TYPE,
      },
    },
  );
}

export async function POST(request: Request) {
  let payload: ChatApiRequest;

  try {
    payload = (await request.json()) as ChatApiRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!payload?.session_id?.trim() || !payload?.message?.trim()) {
    return NextResponse.json(
      { error: 'session_id and message are required.' },
      { status: 400 },
    );
  }

  try {
    const result = await handleChatMessage(payload);

    if (wantsStreamingResponse(request)) {
      return streamChatResult(result);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Chat request failed.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}