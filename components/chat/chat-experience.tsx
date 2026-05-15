'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, Send, Sparkles } from 'lucide-react';

import {
  buildTrackClickPayload,
  buildTrackedAffiliateUrl,
  generateSubId,
} from '@/lib/tracking';
import { Button } from '@/components/ui/button';
import type { RecommendationItem } from '@/types/chat';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: RecommendationItem[];
};

type ChatApiResponse = {
  reply: string;
  needsMoreInfo: boolean;
  recommendations?: RecommendationItem[];
};

type ChatApiError = {
  error?: string;
};

type ChatStreamEvent =
  | {
      type: 'reply_delta';
      reply: string;
    }
  | {
      type: 'recommendations';
      recommendations: RecommendationItem[];
    }
  | {
      type: 'done';
    };

const STREAM_CONTENT_TYPE = 'application/x-ndjson';

function isChatApiError(payload: ChatApiResponse | ChatApiError): payload is ChatApiError {
  return 'error' in payload;
}

function isStreamingResponse(response: Response) {
  return (
    response.headers.get('content-type')?.includes(STREAM_CONTENT_TYPE) === true &&
    response.body
  );
}

function createMessageId(role: ChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function upsertAssistantMessage(
  currentMessages: ChatMessage[],
  messageId: string,
  content: string,
  recommendations?: RecommendationItem[],
) {
  const existingIndex = currentMessages.findIndex(
    (message) => message.id === messageId,
  );

  if (existingIndex === -1) {
    return [
      ...currentMessages,
      {
        id: messageId,
        role: 'assistant' as const,
        content,
        recommendations,
      },
    ];
  }

  return currentMessages.map((message) =>
    message.id === messageId
      ? {
          ...message,
          content,
          recommendations,
        }
      : message,
  );
}

async function readStreamingChatResponse(
  response: Response,
  assistantMessageId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Streaming response body is unavailable.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let streamedReply = '';
  let streamedRecommendations: RecommendationItem[] | undefined;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as ChatStreamEvent;

      if (event.type === 'reply_delta') {
        streamedReply = event.reply;
        setIsLoading(false);
        setMessages((currentMessages) =>
          upsertAssistantMessage(
            currentMessages,
            assistantMessageId,
            streamedReply,
            streamedRecommendations,
          ),
        );
      }

      if (event.type === 'recommendations') {
        streamedRecommendations = event.recommendations;
        setMessages((currentMessages) =>
          upsertAssistantMessage(
            currentMessages,
            assistantMessageId,
            streamedReply,
            streamedRecommendations,
          ),
        );
      }

      if (event.type === 'done') {
        setIsLoading(false);
      }
    }
  }

  const finalChunk = buffer.trim();

  if (finalChunk) {
    const event = JSON.parse(finalChunk) as ChatStreamEvent;

    if (event.type === 'reply_delta') {
      streamedReply = event.reply;
      setMessages((currentMessages) =>
        upsertAssistantMessage(
          currentMessages,
          assistantMessageId,
          streamedReply,
          streamedRecommendations,
        ),
      );
    }

    if (event.type === 'recommendations') {
      streamedRecommendations = event.recommendations;
      setMessages((currentMessages) =>
        upsertAssistantMessage(
          currentMessages,
          assistantMessageId,
          streamedReply,
          streamedRecommendations,
        ),
      );
    }
  }
}

const QUICK_REPLIES = [
  'I need project management software for a small team.',
  'We need a CRM for a growing sales team.',
  'I want a low-cost support platform.',
  'Help me find workflow automation tools.',
];

const SESSION_STORAGE_KEY = 'toolmatch-session-id';

function createMessage(
  role: ChatMessage['role'],
  content: string,
  recommendations?: RecommendationItem[],
): ChatMessage {
  return {
    id: createMessageId(role),
    role,
    content,
    recommendations,
  };
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const nextId = createSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextId);
  return nextId;
}

function RecommendationCard({
  recommendation,
  sessionId,
}: {
  recommendation: RecommendationItem;
  sessionId: string;
}) {
  const trackingTargetRef = useRef<{ subId: string; trackedUrl: string } | null>(null);

  if (!trackingTargetRef.current) {
    const subId = generateSubId(sessionId, recommendation.offer_id);
    trackingTargetRef.current = {
      subId,
      trackedUrl: buildTrackedAffiliateUrl(
        recommendation.affiliate_url,
        sessionId,
        subId,
      ),
    };
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const { subId, trackedUrl } = trackingTargetRef.current!;
    const payload = buildTrackClickPayload(
      recommendation.offer_id,
      sessionId,
      subId,
      recommendation.recommendation_id,
      typeof window !== 'undefined' ? window.location.href : undefined,
    );

    let trackingQueued = false;

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      trackingQueued = navigator.sendBeacon('/api/track/click', blob);
    }

    if (!trackingQueued) {
      void fetch('/api/track/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
        body: JSON.stringify(payload),
      }).catch(() => undefined);
    }

    window.open(trackedUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <article className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary">
          {recommendation.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${recommendation.name} logo`}
              className="h-full w-full object-cover"
              src={recommendation.logo_url}
            />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {recommendation.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Rank {recommendation.rank}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">
                {recommendation.name}
              </h3>
            </div>

            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              {recommendation.match_score}% match
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {recommendation.description}
          </p>
          <p className="mt-3 rounded-2xl bg-[#f8f5ee] px-4 py-3 text-sm leading-6 text-foreground">
            {recommendation.match_reason}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-5 text-muted-foreground">
              Affiliate disclosure: this link may earn ToolMatch AI a commission.
            </p>

            <a
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              data-session-id={sessionId}
              href={trackingTargetRef.current.trackedUrl}
              onClick={handleClick}
              rel="noreferrer"
              target="_blank"
            >
              Visit Site
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ChatExperience({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'I’m Arlo. Tell me what kind of tool you need, who it is for, and any budget or workflow priorities you already know.',
    ),
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [savePromptState, setSavePromptState] = useState<'idle' | 'ready'>('idle');

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    const transcriptElement = transcriptRef.current;

    if (transcriptElement) {
      if (typeof transcriptElement.scrollTo === 'function') {
        transcriptElement.scrollTo({
          top: transcriptElement.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        transcriptElement.scrollTop = transcriptElement.scrollHeight;
      }
    } else if (typeof transcriptEndRef.current?.scrollIntoView === 'function') {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, errorMessage]);

  const hasRecommendations = useMemo(
    () => messages.some((message) => (message.recommendations?.length ?? 0) > 0),
    [messages],
  );
  const hasUserMessages = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages],
  );
  const canSend = Boolean(sessionId) && !isLoading;

  useEffect(() => {
    if (hasRecommendations) {
      setSavePromptState('ready');
    }
  }, [hasRecommendations]);

  async function submitMessage(message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !sessionId || isLoading) {
      return;
    }

    setErrorMessage(null);
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', trimmedMessage),
    ]);
    setInputValue('');
    setIsLoading(true);

    try {
      const assistantMessageId = createMessageId('assistant');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Accept: `${STREAM_CONTENT_TYPE}, application/json`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: trimmedMessage,
        }),
      });

      if (isStreamingResponse(response)) {
        await readStreamingChatResponse(
          response,
          assistantMessageId,
          setMessages,
          setIsLoading,
        );
        return;
      }

      const payload = (await response.json()) as ChatApiResponse | ChatApiError;
      if (!response.ok) {
        throw new Error(
          isChatApiError(payload) && payload.error
            ? payload.error
            : 'Chat request failed.',
        );
      }

      if (isChatApiError(payload)) {
        throw new Error(payload.error || 'Chat request failed.');
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage('assistant', payload.reply, payload.recommendations),
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while contacting Arlo.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(inputValue);
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,111,82,0.16),_transparent_42%),linear-gradient(180deg,#fcfaf5_0%,#f4efe3_100%)] px-4 py-6 text-foreground sm:px-6 sm:py-8'}`}>
      <div className={`mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-border/70 bg-white/75 p-4 shadow-[0_30px_80px_rgba(76,54,41,0.12)] backdrop-blur sm:p-6 lg:grid lg:grid-cols-[0.72fr_1.28fr] lg:p-8 ${embedded ? 'min-h-[46rem] lg:h-[50rem] lg:min-h-0' : 'min-h-[calc(100vh-3rem)]'}`}>
        <section className="flex min-h-0 flex-col justify-between rounded-[1.75rem] bg-[#19372e] p-6 text-[#f5efe5] sm:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#d9d2c8]">
              ToolMatch AI
            </p>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.9rem]">
              Find the right software with Arlo in one guided chat.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#d9d2c8] sm:text-base">
              Describe your use case, team, and budget. Arlo turns that context
              into ranked software recommendations with clear reasoning and a
              direct path to evaluate each tool.
            </p>
          </div>

          <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-[#d9d2c8] sm:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#f7d4b6]">
                What Arlo asks
              </p>
              <p className="mt-2">Use case, team size, budget, and the priorities that matter most.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#f7d4b6]">
                What you get
              </p>
              <p className="mt-2">Ranked recommendations with match reasons and direct vendor links.</p>
            </div>
          </div>
        </section>

        <section className={`flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-4 sm:p-6 lg:h-full lg:min-h-0 ${embedded ? 'min-h-[30rem]' : 'min-h-[36rem]'}`}>
          <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Live Chat
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">
                Tell Arlo what you need.
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground sm:inline-flex">
              <Sparkles className="h-4 w-4" />
              Session ready
            </div>
          </div>

          <div
            aria-live="polite"
            className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 overscroll-contain"
            ref={transcriptRef}
            role="log"
          >
            {messages.map((message) => (
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                key={message.id}
              >
                <div
                  className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[#f8f5ee] text-foreground'
                  }`}
                >
                  <p>{message.content}</p>

                  {message.role === 'assistant' && !hasUserMessages ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((quickReply) => (
                        <button
                          className="rounded-full border border-border bg-white px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          disabled={!canSend}
                          key={quickReply}
                          onClick={() => {
                            void submitMessage(quickReply);
                          }}
                          type="button"
                        >
                          {quickReply}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {message.recommendations && message.recommendations.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {message.recommendations.map((recommendation) => (
                        <RecommendationCard
                          key={recommendation.offer_id}
                          recommendation={recommendation}
                          sessionId={sessionId}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-3 rounded-[1.5rem] bg-[#f8f5ee] px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Arlo is thinking through your options...
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[1.5rem] border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm leading-6 text-[#7d3d2f] shadow-sm sm:max-w-[75%]">
                  {errorMessage}
                </div>
              </div>
            ) : null}

            <div ref={transcriptEndRef} />
          </div>

          <div className="mt-4 border-t border-border/80 pt-4">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="chat-input">
                Describe the tool you need
              </label>
              <textarea
                className="min-h-[5rem] flex-1 rounded-[1.25rem] border border-input bg-white px-4 py-3 text-sm leading-6 text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                id="chat-input"
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Describe your use case, team, budget, or priorities."
                value={inputValue}
              />
              <Button className="shrink-0 sm:self-end" disabled={!canSend} type="submit">
                Send
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Your browser session stays local to this tab so Arlo can keep the
              conversation consistent across turns.
            </p>
          </div>

          {savePromptState === 'ready' ? (
            <aside className="mt-4 rounded-[1.5rem] border border-border bg-[#fcfaf5] p-4">
              <p className="text-sm font-semibold text-foreground">
                Want these results saved for later?
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add an email address and we can wire delivery into a later MVP pass.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="save-results-email">
                  Email address for saved results
                </label>
                <input
                  className="h-11 flex-1 rounded-full border border-input bg-white px-4 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                  id="save-results-email"
                  onChange={(event) => setEmailValue(event.target.value)}
                  placeholder="you@example.com"
                  value={emailValue}
                />
                <Button
                  onClick={() => setSavePromptState('idle')}
                  type="button"
                  variant="outline"
                >
                  Keep browsing
                </Button>
              </div>
            </aside>
          ) : null}
        </section>
      </div>
    </div>
  );
}