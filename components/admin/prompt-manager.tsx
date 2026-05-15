'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import type {
  AdminPromptDetail,
  AdminPromptListItem,
  AdminPromptSandboxResponse,
} from '@/types/admin';

type SandboxMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function parseSandboxTranscript(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [roleLabel, ...contentParts] = line.split(':');
      const role = roleLabel?.trim().toLowerCase() === 'assistant' ? 'assistant' : 'user';

      return {
        role,
        content: contentParts.join(':').trim(),
      } as SandboxMessage;
    })
    .filter((message) => message.content);
}

export function PromptManager() {
  const [activePrompt, setActivePrompt] = useState<AdminPromptDetail | null>(null);
  const [prompts, setPrompts] = useState<AdminPromptListItem[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<AdminPromptDetail | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [activateOnSave, setActivateOnSave] = useState(false);
  const [sandboxTranscript, setSandboxTranscript] = useState(
    'user: I need project management software for a small team.\nuser: Budget is under $50 and collaboration matters most.',
  );
  const [sandboxResult, setSandboxResult] = useState<AdminPromptSandboxResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSandboxing, setIsSandboxing] = useState(false);

  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/prompts');
      const payload = (await response.json()) as {
        activePrompt?: AdminPromptDetail | null;
        prompts?: AdminPromptListItem[];
        error?: string;
      };

      if (!response.ok || !payload.prompts) {
        throw new Error(payload.error || 'Failed to load prompts.');
      }

      setActivePrompt(payload.activePrompt ?? null);
      setPrompts(payload.prompts);
      setSelectedPrompt((current) => current ?? payload.activePrompt ?? null);
      setDraftContent((current) => current || payload.activePrompt?.content || current);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load prompts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);

  async function loadPromptDetail(id: string) {
    try {
      const response = await fetch(`/api/admin/prompts/${id}`);
      const payload = (await response.json()) as {
        prompt?: AdminPromptDetail;
        error?: string;
      };

      if (!response.ok || !payload.prompt) {
        throw new Error(payload.error || 'Failed to load prompt.');
      }

      setSelectedPrompt(payload.prompt);
      setDraftContent(payload.prompt.content);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load prompt.');
    }
  }

  async function handleSavePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: draftContent,
          activate: activateOnSave,
        }),
      });
      const payload = (await response.json()) as {
        prompt?: AdminPromptDetail;
        error?: string;
      };

      if (!response.ok || !payload.prompt) {
        throw new Error(payload.error || 'Failed to save prompt.');
      }

      setSelectedPrompt(payload.prompt);
      setActivePrompt(payload.prompt.is_active ? payload.prompt : activePrompt);
      setActivateOnSave(false);
      await loadPrompts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save prompt.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivatePrompt(id: string, mode: 'activate' | 'revert') {
    setErrorMessage('');

    try {
      const response = await fetch(`/api/admin/prompts/${id}/${mode}`, {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        prompt?: AdminPromptDetail;
        error?: string;
      };

      if (!response.ok || !payload.prompt) {
        throw new Error(payload.error || `Failed to ${mode} prompt.`);
      }

      setActivePrompt(payload.prompt);
      setSelectedPrompt(payload.prompt);
      setDraftContent(payload.prompt.content);
      await loadPrompts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Prompt activation failed.');
    }
  }

  async function handleSandbox() {
    setIsSandboxing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/prompts/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: draftContent,
          sampleConversation: parseSandboxTranscript(sandboxTranscript),
        }),
      });
      const payload = (await response.json()) as AdminPromptSandboxResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Sandbox failed.');
      }

      setSandboxResult(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sandbox failed.');
    } finally {
      setIsSandboxing(false);
    }
  }

  const promptCountLabel = useMemo(() => `${prompts.length} version${prompts.length === 1 ? '' : 's'}`, [prompts.length]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe3_0%,#fcfaf5_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Protected Admin</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground">Prompt Studio</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                Review the active prompt, save versioned drafts without overwriting history, and sandbox prompt behavior before making a prompt active.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin">Offers</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=questionnaires">Questionnaires</a>
                <span className="rounded-full bg-secondary px-4 py-2 text-secondary-foreground">Prompts</span>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=analytics">Analytics</a>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=revenue">Revenue</a>
              </div>
            </div>

            <form action="/api/admin/logout" method="post">
              <button className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm text-[#7d3d2f]">{errorMessage}</div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Active prompt</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Current production prompt loaded by the live recommendation flow.</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{promptCountLabel}</span>
              </div>

              {isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading prompts...</p>
              ) : activePrompt ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Version {activePrompt.version}</p>
                  <pre className="whitespace-pre-wrap rounded-[1.25rem] bg-[#faf6ee] p-4 text-sm leading-6 text-foreground">{activePrompt.content}</pre>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No active prompt found yet.</p>
              )}
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <div className="border-b border-border/80 pb-4">
                <h2 className="text-2xl font-semibold text-foreground">Version history</h2>
                <p className="mt-1 text-sm text-muted-foreground">Inspect prior prompt versions and activate or revert them without overwriting history.</p>
              </div>

              <div className="mt-4 space-y-3">
                {prompts.map((prompt) => (
                  <button
                    className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition-colors ${selectedPrompt?.id === prompt.id ? 'border-primary bg-[#f3f8f5]' : 'border-border hover:bg-[#faf6ee]'}`}
                    key={prompt.id}
                    onClick={() => {
                      void loadPromptDetail(prompt.id);
                    }}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Version {prompt.version}</p>
                        <p className="text-xs text-muted-foreground">{new Date(prompt.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${prompt.is_active ? 'bg-[#e8f2ec] text-[#1b5c40]' : 'bg-secondary text-secondary-foreground'}`}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {!prompt.is_active ? (
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleActivatePrompt(prompt.id, activePrompt ? 'revert' : 'activate');
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {activePrompt ? 'Revert' : 'Activate'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <div className="border-b border-border/80 pb-4">
                <h2 className="text-2xl font-semibold text-foreground">Save new prompt version</h2>
                <p className="mt-1 text-sm text-muted-foreground">Create a new prompt version without destructive overwrite. Optionally activate it immediately.</p>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSavePrompt}>
                <label className="block text-sm font-medium text-foreground" htmlFor="prompt-content">
                  Prompt content
                </label>
                <textarea
                  className="min-h-[14rem] w-full rounded-[1rem] border border-input px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="prompt-content"
                  onChange={(event) => setDraftContent(event.target.value)}
                  value={draftContent}
                />
                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <input checked={activateOnSave} onChange={(event) => setActivateOnSave(event.target.checked)} type="checkbox" />
                  Activate this version after saving
                </label>
                <Button disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : 'Save prompt version'}
                </Button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <div className="border-b border-border/80 pb-4">
                <h2 className="text-2xl font-semibold text-foreground">Sandbox</h2>
                <p className="mt-1 text-sm text-muted-foreground">Test a draft prompt against representative multi-turn input without changing production prompt state.</p>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-foreground" htmlFor="sandbox-transcript">
                  Sample conversation
                </label>
                <textarea
                  className="min-h-[8rem] w-full rounded-[1rem] border border-input px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="sandbox-transcript"
                  onChange={(event) => setSandboxTranscript(event.target.value)}
                  value={sandboxTranscript}
                />
                <Button disabled={isSandboxing} onClick={() => void handleSandbox()} type="button" variant="outline">
                  {isSandboxing ? 'Running sandbox...' : 'Run sandbox'}
                </Button>

                {sandboxResult ? (
                  <div className="rounded-[1.25rem] border border-border bg-[#faf6ee] p-4">
                    <p className="text-sm font-semibold text-foreground">Sandbox reply</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{sandboxResult.reply}</p>
                    {sandboxResult.recommendations?.length ? (
                      <div className="mt-4 space-y-2">
                        {sandboxResult.recommendations.map((recommendation) => (
                          <div className="rounded-xl border border-border bg-white px-3 py-2 text-sm" key={recommendation.offer_id}>
                            <strong>{recommendation.name ?? recommendation.offer_id}</strong>
                            <span className="ml-2 text-muted-foreground">{recommendation.match_score}%</span>
                            <p className="mt-1 text-muted-foreground">{recommendation.match_reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}