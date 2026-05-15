'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { SUPPORTED_USE_CASE_LABELS, SUPPORTED_USE_CASES } from '@/lib/ai/constants';
import {
  buildTrackClickPayload,
  buildTrackedAffiliateUrl,
  generateSubId,
} from '@/lib/tracking';
import type {
  PublicQuestionnaire,
  QuestionnaireSubmissionResponse,
} from '@/types/admin';

const SESSION_STORAGE_KEY = 'toolmatch-session-id';

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

export function QuestionnaireExperience() {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get('category')?.trim() ?? '';
  const [sessionId, setSessionId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    SUPPORTED_USE_CASES.includes(requestedCategory as (typeof SUPPORTED_USE_CASES)[number])
      ? requestedCategory
      : '',
  );
  const [questionnaire, setQuestionnaire] = useState<PublicQuestionnaire | null>(null);
  const [submissionId, setSubmissionId] = useState('');
  const [currentQuestionId, setCurrentQuestionId] = useState<string | undefined>('');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<
    QuestionnaireSubmissionResponse['recommendations']
  >();
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const nextSessionId = getOrCreateSessionId();
    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    const nextCategory = searchParams.get('category')?.trim() ?? '';
    setSelectedCategory(
      SUPPORTED_USE_CASES.includes(nextCategory as (typeof SUPPORTED_USE_CASES)[number])
        ? nextCategory
        : '',
    );
  }, [searchParams]);

  useEffect(() => {
    setQuestionnaire(null);
    setSubmissionId('');
    setCurrentQuestionId('');
    setAnswers({});
    setQuestionHistory([]);
    setRecommendations(undefined);
    setReply('');

    if (!selectedCategory) {
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    async function loadQuestionnaire() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(`/api/questionnaires/active?category=${encodeURIComponent(selectedCategory)}`);
        const payload = (await response.json()) as {
          questionnaire?: PublicQuestionnaire | null;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load questionnaire.');
        }

        setQuestionnaire(payload.questionnaire ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load questionnaire.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuestionnaire();
  }, [selectedCategory]);

  const currentQuestion = useMemo(
    () => questionnaire?.questions.find((question) => question.id === currentQuestionId),
    [currentQuestionId, questionnaire],
  );

  const progressLabel = useMemo(() => {
    if (!currentQuestion || !questionnaire) {
      return '';
    }

    return `Step ${currentQuestion.display_order} of ${questionnaire.questions.length}`;
  }, [currentQuestion, questionnaire]);

  const selectedCategoryLabel = selectedCategory
    ? SUPPORTED_USE_CASE_LABELS[selectedCategory as keyof typeof SUPPORTED_USE_CASE_LABELS]
    : '';

  async function startQuestionnaire() {
    if (!sessionId) {
      return;
    }

    setIsStarting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/questionnaires/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, category: selectedCategory }),
      });
      const payload = (await response.json()) as {
        submission?: { id: string; current_question_id?: string };
        questionnaire?: PublicQuestionnaire;
        error?: string;
      };

      if (!response.ok || !payload.submission || !payload.questionnaire) {
        throw new Error(payload.error || 'Failed to start questionnaire.');
      }

      setQuestionnaire(payload.questionnaire);
      setSubmissionId(payload.submission.id);
      setCurrentQuestionId(payload.submission.current_question_id);
      setQuestionHistory(payload.submission.current_question_id ? [payload.submission.current_question_id] : []);
      setAnswers({});
      setRecommendations(undefined);
      setReply('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start questionnaire.');
    } finally {
      setIsStarting(false);
    }
  }

  async function submitAnswer() {
    if (!submissionId || !currentQuestion) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/questionnaires/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          value: answers[currentQuestion.key],
        }),
      });
      const payload = (await response.json()) as QuestionnaireSubmissionResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save answer.');
      }

      setAnswers(payload.answers);
      setCurrentQuestionId(payload.current_question_id);
      setReply(payload.reply ?? '');

      if (payload.completed) {
        setRecommendations(payload.recommendations);
      } else if (payload.current_question_id) {
        setQuestionHistory((current) => {
          const nextHistory = current.includes(payload.current_question_id!)
            ? current.slice(0, current.indexOf(payload.current_question_id!) + 1)
            : [...current, payload.current_question_id!];
          return nextHistory;
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save answer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function setCurrentAnswer(value: unknown) {
    if (!currentQuestion) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [currentQuestion.key]: value,
    }));
  }

  function moveBack() {
    if (questionHistory.length <= 1) {
      return;
    }

    const previousQuestionId = questionHistory[questionHistory.length - 2];
    setQuestionHistory((current) => current.slice(0, current.length - 1));
    setCurrentQuestionId(previousQuestionId);
    setRecommendations(undefined);
    setReply('');
  }

  function renderQuestionInput() {
    if (!currentQuestion) {
      return null;
    }

    const answer = answers[currentQuestion.key];

    if (currentQuestion.question_type === 'text') {
      return (
        <textarea
          className="min-h-[7rem] w-full rounded-[1.25rem] border border-input px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setCurrentAnswer(event.target.value)}
          placeholder="Type your answer"
          value={String(answer ?? '')}
        />
      );
    }

    if (currentQuestion.question_type === 'number') {
      return (
        <input
          className="h-12 w-full rounded-[1.25rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setCurrentAnswer(event.target.value)}
          placeholder="Enter a number"
          type="number"
          value={String(answer ?? '')}
        />
      );
    }

    if (currentQuestion.question_type === 'boolean') {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {[true, false].map((value) => (
            <button
              className={`rounded-[1.25rem] border px-4 py-4 text-left text-sm transition-colors ${answer === value ? 'border-primary bg-[#f7efe0] text-foreground' : 'border-border bg-white text-muted-foreground hover:bg-[#faf6ee]'}`}
              key={String(value)}
              onClick={() => setCurrentAnswer(value)}
              type="button"
            >
              {value ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.question_type === 'multi_select') {
      const selectedValues = Array.isArray(answer) ? answer.map(String) : [];

      return (
        <div className="grid gap-3">
          {(currentQuestion.options ?? []).map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <label className={`flex cursor-pointer items-center gap-3 rounded-[1.25rem] border px-4 py-4 text-sm transition-colors ${checked ? 'border-primary bg-[#f7efe0] text-foreground' : 'border-border bg-white text-muted-foreground hover:bg-[#faf6ee]'}`} key={option.id}>
                <input
                  checked={checked}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((value) => value !== option.value);
                    setCurrentAnswer(nextValues);
                  }}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {(currentQuestion.options ?? []).map((option) => (
          <button
            className={`rounded-[1.25rem] border px-4 py-4 text-left text-sm transition-colors ${answer === option.value ? 'border-primary bg-[#f7efe0] text-foreground' : 'border-border bg-white text-muted-foreground hover:bg-[#faf6ee]'}`}
            key={option.id}
            onClick={() => setCurrentAnswer(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe3_0%,#fcfaf5_100%)] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Guided Quiz</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground">Find the right tool faster</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Answer a short branching questionnaire and get ranked software matches tuned to your use case, team size, budget, and priorities.</p>
              {selectedCategoryLabel ? <p className="mt-3 text-sm font-medium text-foreground">Current category: {selectedCategoryLabel}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/#chat">Talk to Arlo</a>
              <span className="rounded-full bg-secondary px-4 py-2 text-secondary-foreground">Questionnaire</span>
            </div>
          </div>
        </div>

        {errorMessage ? <div className="rounded-2xl border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm text-[#7d3d2f]">{errorMessage}</div> : null}

        {!selectedCategory ? (
          <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Pick a category</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Choose the type of software you want help with</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Each category can now have its own admin-managed questionnaire. Select a category to load the matching quiz flow.</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {SUPPORTED_USE_CASES.map((useCase) => (
                <button
                  className="rounded-[1.25rem] border border-border bg-[#fcfaf5] px-4 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-[#faf6ee]"
                  key={useCase}
                  onClick={() => setSelectedCategory(useCase)}
                  type="button"
                >
                  {SUPPORTED_USE_CASE_LABELS[useCase]}
                </button>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="rounded-[2rem] border border-border bg-white p-6 text-sm text-muted-foreground shadow-[0_18px_60px_rgba(67,47,31,0.08)]">Loading questionnaire...</div>
        ) : !questionnaire ? (
          <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
            <h2 className="text-2xl font-semibold text-foreground">No live questionnaire for this category yet</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Activate a questionnaire draft for {selectedCategoryLabel || 'this category'} in the admin builder before sending visitors to the guided quiz flow.</p>
          </div>
        ) : !submissionId ? (
          <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Active questionnaire</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">{questionnaire.name}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">The quiz adapts to your answers and hands the result into the existing recommendation pipeline when you finish.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={isStarting} onClick={() => void startQuestionnaire()} type="button">{isStarting ? 'Starting...' : 'Start questionnaire'}</Button>
              <Button onClick={() => setSelectedCategory('')} type="button" variant="outline">Change category</Button>
              <a className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary" href="/">Skip to chat</a>
            </div>
          </div>
        ) : recommendations?.length ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Quiz complete</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">Your recommended tools</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{reply}</p>
            </div>

            <section className="grid gap-4">
              {recommendations.map((recommendation) => {
                const subId = generateSubId(sessionId, recommendation.offer_id);
                const trackedUrl = buildTrackedAffiliateUrl(recommendation.affiliate_url, sessionId, subId);

                return (
                  <article className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm" key={recommendation.recommendation_id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Rank {recommendation.rank}</p>
                        <h3 className="mt-1 text-xl font-semibold text-foreground">{recommendation.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{recommendation.description}</p>
                        <p className="mt-3 rounded-2xl bg-[#f8f5ee] px-4 py-3 text-sm leading-6 text-foreground">{recommendation.match_reason}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">{recommendation.match_score}% match</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-muted-foreground">Affiliate disclosure: this link may earn ToolMatch AI a commission.</p>
                      <a
                        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        href={trackedUrl}
                        onClick={(event) => {
                          event.preventDefault();
                          const payload = buildTrackClickPayload(
                            recommendation.offer_id,
                            sessionId,
                            subId,
                            recommendation.recommendation_id,
                            typeof window !== 'undefined' ? window.location.href : undefined,
                          );

                          void fetch('/api/track/click', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            keepalive: true,
                            body: JSON.stringify(payload),
                          }).catch(() => undefined);

                          window.open(trackedUrl, '_blank', 'noopener,noreferrer');
                        }}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Visit site
                      </a>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        ) : currentQuestion ? (
          <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{progressLabel}</p>
                <h2 className="mt-3 text-3xl font-semibold text-foreground">{currentQuestion.prompt}</h2>
                {currentQuestion.helper_text ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentQuestion.helper_text}</p> : null}
              </div>
              <div className="hidden h-3 w-40 overflow-hidden rounded-full bg-[#f1ebdf] md:block">
                <div className="h-full rounded-full bg-[#b98952]" style={{ width: `${(currentQuestion.display_order / questionnaire.questions.length) * 100}%` }} />
              </div>
            </div>

            <div className="mt-6">{renderQuestionInput()}</div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button disabled={questionHistory.length <= 1 || isSubmitting} onClick={moveBack} type="button" variant="outline">Back</Button>
              <Button disabled={isSubmitting} onClick={() => void submitAnswer()} type="button">{isSubmitting ? 'Saving...' : 'Next'}</Button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}