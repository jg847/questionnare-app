'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SUPPORTED_USE_CASE_LABELS, SUPPORTED_USE_CASES } from '@/lib/ai/constants';
import type {
  AdminQuestionnaireBranchInput,
  AdminQuestionnaireDetail,
  AdminQuestionnaireInput,
  AdminQuestionnaireListItem,
  AdminQuestionnaireOptionInput,
  AdminQuestionnaireQuestionInput,
  AdminQuestionnaireValidationResult,
  PublicQuestionnaire,
} from '@/types/admin';

type QuestionnaireEditorState = {
  name: string;
  slug: string;
  category: string;
  questions: AdminQuestionnaireQuestionInput[];
};

function createId() {
  return crypto.randomUUID();
}

function createEmptyOption(displayOrder = 1): AdminQuestionnaireOptionInput {
  return {
    id: createId(),
    label: '',
    value: '',
    display_order: displayOrder,
  };
}

function createEmptyBranch(displayOrder = 1): AdminQuestionnaireBranchInput {
  return {
    id: createId(),
    operator: 'equals',
    expected_value: '',
    display_order: displayOrder,
  };
}

function createEmptyQuestion(displayOrder = 1): AdminQuestionnaireQuestionInput {
  return {
    id: createId(),
    key: `question_${displayOrder}`,
    prompt: '',
    question_type: 'single_select',
    required: true,
    display_order: displayOrder,
    options: [createEmptyOption(1)],
    branches: [],
  };
}

const EMPTY_EDITOR: QuestionnaireEditorState = {
  name: '',
  slug: '',
  category: '',
  questions: [createEmptyQuestion(1)],
};

function mapDetailToEditorState(detail: AdminQuestionnaireDetail): QuestionnaireEditorState {
  return {
    name: detail.name,
    slug: detail.slug,
    category: detail.category,
    questions: detail.questions.map((question) => ({
      ...question,
      id: question.id ?? createId(),
      options: (question.options ?? []).map((option) => ({
        ...option,
        id: option.id ?? createId(),
      })),
      branches: (question.branches ?? []).map((branch) => ({
        ...branch,
        id: branch.id ?? createId(),
      })),
    })),
  };
}

function parseBranchExpectedValue(
  branch: AdminQuestionnaireBranchInput,
  question: AdminQuestionnaireQuestionInput,
  allQuestions: AdminQuestionnaireQuestionInput[],
) {
  const sourceQuestion = branch.source_question_key
    ? allQuestions.find((item) => item.key === branch.source_question_key)
    : question;
  const rawValue = branch.expected_value;

  if (branch.operator === 'in') {
    return String(rawValue)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (sourceQuestion?.question_type === 'number') {
    return Number(rawValue);
  }

  if (sourceQuestion?.question_type === 'boolean') {
    return String(rawValue).toLowerCase() === 'true';
  }

  return rawValue;
}

function buildPayload(state: QuestionnaireEditorState): AdminQuestionnaireInput {
  return {
    name: state.name,
    slug: state.slug,
    category: state.category,
    questions: state.questions.map((question, index) => ({
      ...question,
      display_order: index + 1,
      options: ['single_select', 'multi_select'].includes(question.question_type)
        ? (question.options ?? []).map((option, optionIndex) => ({
            ...option,
            display_order: optionIndex + 1,
          }))
        : [],
      branches: (question.branches ?? []).map((branch, branchIndex) => ({
        ...branch,
        expected_value: parseBranchExpectedValue(branch, question, state.questions),
        display_order: branchIndex + 1,
      })),
    })),
  };
}

export function QuestionnaireManager() {
  const [questionnaires, setQuestionnaires] = useState<AdminQuestionnaireListItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<QuestionnaireEditorState>(EMPTY_EDITOR);
  const [selectedMeta, setSelectedMeta] = useState<AdminQuestionnaireDetail | null>(null);
  const [preview, setPreview] = useState<PublicQuestionnaire | null>(null);
  const [validation, setValidation] = useState<AdminQuestionnaireValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function loadQuestionnaires(nextSelectedId?: string | null) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/questionnaires');
      const payload = (await response.json()) as {
        questionnaires?: AdminQuestionnaireListItem[];
        error?: string;
      };

      if (!response.ok || !payload.questionnaires) {
        throw new Error(payload.error || 'Failed to load questionnaires.');
      }

      setQuestionnaires(payload.questionnaires);

      const targetId = nextSelectedId ?? selectedId ?? payload.questionnaires[0]?.id ?? null;

      if (targetId) {
        await loadQuestionnaireDetail(targetId);
      } else {
        setSelectedId(null);
        setSelectedMeta(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load questionnaires.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadQuestionnaireDetail(id: string) {
    setErrorMessage('');

    try {
      const response = await fetch(`/api/admin/questionnaires/${id}`);
      const payload = (await response.json()) as {
        questionnaire?: AdminQuestionnaireDetail;
        error?: string;
      };

      if (!response.ok || !payload.questionnaire) {
        throw new Error(payload.error || 'Failed to load questionnaire detail.');
      }

      setSelectedId(id);
      setSelectedMeta(payload.questionnaire);
      setEditorState(mapDetailToEditorState(payload.questionnaire));
      setPreview(null);
      setValidation(null);
      setFieldErrors({});
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load questionnaire detail.',
      );
    }
  }

  useEffect(() => {
    void loadQuestionnaires();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setFieldErrors({});

    try {
      const payload = buildPayload(editorState);
      const response = await fetch(
        selectedId ? `/api/admin/questionnaires/${selectedId}` : '/api/admin/questionnaires',
        {
          method: selectedId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const json = (await response.json()) as {
        questionnaire?: AdminQuestionnaireDetail;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !json.questionnaire) {
        setFieldErrors(json.fieldErrors ?? {});
        throw new Error(json.error || 'Failed to save questionnaire.');
      }

      setSelectedMeta(json.questionnaire);
      setSelectedId(json.questionnaire.id);
      setEditorState(mapDetailToEditorState(json.questionnaire));
      await loadQuestionnaires(json.questionnaire.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save questionnaire.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleValidate() {
    if (!selectedId) {
      return;
    }

    setErrorMessage('');

    try {
      const response = await fetch(`/api/admin/questionnaires/${selectedId}/validate`, {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        validation?: AdminQuestionnaireValidationResult;
        error?: string;
      };

      if (!response.ok || !payload.validation) {
        throw new Error(payload.error || 'Failed to validate questionnaire.');
      }

      setValidation(payload.validation);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to validate questionnaire.',
      );
    }
  }

  async function handlePreview() {
    if (!selectedId) {
      return;
    }

    setErrorMessage('');

    try {
      const response = await fetch(`/api/admin/questionnaires/${selectedId}/preview`, {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        questionnaire?: PublicQuestionnaire;
        validation?: AdminQuestionnaireValidationResult;
        error?: string;
      };

      if (!response.ok || !payload.questionnaire) {
        throw new Error(payload.error || 'Failed to preview questionnaire.');
      }

      setPreview(payload.questionnaire);
      setValidation(payload.validation ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to preview questionnaire.');
    }
  }

  async function handleActivate() {
    if (!selectedId) {
      return;
    }

    setErrorMessage('');

    try {
      const response = await fetch(`/api/admin/questionnaires/${selectedId}/activate`, {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        questionnaire?: AdminQuestionnaireDetail;
        validation?: AdminQuestionnaireValidationResult;
        error?: string;
      };

      if (!response.ok || !payload.questionnaire) {
        setValidation(payload.validation ?? null);
        throw new Error(payload.error || 'Failed to activate questionnaire.');
      }

      setSelectedMeta(payload.questionnaire);
      setValidation(payload.validation ?? null);
      await loadQuestionnaires(payload.questionnaire.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to activate questionnaire.');
    }
  }

  const questionSelectOptions = useMemo(
    () =>
      editorState.questions.map((question) => ({
        id: question.id ?? '',
        key: question.key,
        label: question.prompt || question.key,
      })),
    [editorState.questions],
  );

  const filteredQuestionnaires = useMemo(
    () =>
      categoryFilter === 'all'
        ? questionnaires
        : questionnaires.filter((questionnaire) => questionnaire.category === categoryFilter),
    [categoryFilter, questionnaires],
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe3_0%,#fcfaf5_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Protected Admin</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground">Questionnaire Builder</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                Build draft questionnaires, configure deterministic branches, preview the public quiz, and activate one live funnel per category without editing code.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin">Offers</a>
                <span className="rounded-full bg-secondary px-4 py-2 text-secondary-foreground">Questionnaires</span>
                <a className="rounded-full border border-border px-4 py-2 hover:bg-secondary" href="/admin?section=prompts">Prompts</a>
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

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Questionnaires</h2>
                <p className="mt-1 text-sm text-muted-foreground">Drafts and the active public quiz for each category.</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedId(null);
                  setSelectedMeta(null);
                  setEditorState({
                    ...EMPTY_EDITOR,
                    questions: [createEmptyQuestion(1)],
                  });
                  setPreview(null);
                  setValidation(null);
                  setFieldErrors({});
                  setErrorMessage('');
                }}
                type="button"
                variant="outline"
              >
                New draft
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border/80">
              <div className="border-b border-border/80 bg-[#faf6ee] px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">Filter questionnaires by category.</p>
                  <select className="h-10 rounded-[1rem] border border-input bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
                    <option value="all">All categories</option>
                    {SUPPORTED_USE_CASES.map((useCase) => (
                      <option key={useCase} value={useCase}>{SUPPORTED_USE_CASE_LABELS[useCase]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                <thead className="bg-[#faf6ee] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Questions</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-white">
                  {isLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-muted-foreground" colSpan={5}>Loading questionnaires...</td>
                    </tr>
                  ) : filteredQuestionnaires.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-muted-foreground" colSpan={5}>No questionnaires match the current category filter.</td>
                    </tr>
                  ) : (
                    filteredQuestionnaires.map((questionnaire) => (
                      <tr
                        className={`cursor-pointer transition-colors hover:bg-[#faf6ee] ${selectedId === questionnaire.id ? 'bg-[#f4efe3]' : ''}`}
                        key={questionnaire.id}
                        onClick={() => {
                          void loadQuestionnaireDetail(questionnaire.id);
                        }}
                      >
                        <td className="px-4 py-4 font-medium text-foreground">
                          <div>{questionnaire.name}</div>
                          <div className="text-xs text-muted-foreground">{questionnaire.slug}</div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{SUPPORTED_USE_CASE_LABELS[questionnaire.category as keyof typeof SUPPORTED_USE_CASE_LABELS] ?? questionnaire.category}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${questionnaire.is_active ? 'bg-[#e8f2ec] text-[#1b5c40]' : 'bg-[#f6e4d8] text-[#8f4f2f]'}`}>
                            {questionnaire.is_active ? 'Active' : questionnaire.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{questionnaire.question_count}</td>
                        <td className="px-4 py-4 text-muted-foreground">{new Date(questionnaire.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
              <div className="flex flex-col gap-4 border-b border-border/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{selectedId ? 'Edit questionnaire' : 'Create questionnaire'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Save drafts freely. Active questionnaires become immutable to preserve submission history.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={!selectedId} onClick={() => void handleValidate()} type="button" variant="outline">Validate</Button>
                  <Button disabled={!selectedId} onClick={() => void handlePreview()} type="button" variant="outline">Preview</Button>
                  <Button disabled={!selectedId || selectedMeta?.is_active} onClick={() => void handleActivate()} type="button">Activate</Button>
                </div>
              </div>

              <form className="mt-5 space-y-6" onSubmit={handleSave}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="questionnaire-name">Name</label>
                    <input className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="questionnaire-name" onChange={(event) => setEditorState((current) => ({ ...current, name: event.target.value }))} value={editorState.name} />
                    {fieldErrors.name ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.name}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="questionnaire-slug">Slug</label>
                    <input className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="questionnaire-slug" onChange={(event) => setEditorState((current) => ({ ...current, slug: event.target.value }))} value={editorState.slug} />
                    {fieldErrors.slug ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.slug}</p> : null}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="questionnaire-category">Category</label>
                  <select className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="questionnaire-category" onChange={(event) => setEditorState((current) => ({ ...current, category: event.target.value }))} value={editorState.category}>
                    <option value="">Select category</option>
                    {SUPPORTED_USE_CASES.map((useCase) => (
                      <option key={useCase} value={useCase}>{SUPPORTED_USE_CASE_LABELS[useCase]}</option>
                    ))}
                  </select>
                  {fieldErrors.category ? <p className="mt-1 text-xs text-[#7d3d2f]">{fieldErrors.category}</p> : null}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Questions</h3>
                      <p className="text-sm text-muted-foreground">Ordered steps with deterministic default and branch transitions.</p>
                    </div>
                    <Button
                      onClick={() =>
                        setEditorState((current) => ({
                          ...current,
                          questions: [
                            ...current.questions,
                            createEmptyQuestion(current.questions.length + 1),
                          ],
                        }))
                      }
                      type="button"
                      variant="outline"
                    >
                      Add question
                    </Button>
                  </div>

                  {fieldErrors.questions ? <p className="text-xs text-[#7d3d2f]">{fieldErrors.questions}</p> : null}

                  {editorState.questions.map((question, questionIndex) => (
                    <section className="rounded-[1.5rem] border border-border/80 bg-[#fcfaf5] p-5" key={question.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Question {questionIndex + 1}</p>
                          <h4 className="mt-1 text-lg font-semibold text-foreground">{question.prompt || question.key || 'Untitled question'}</h4>
                        </div>
                        <Button
                          disabled={editorState.questions.length === 1}
                          onClick={() =>
                            setEditorState((current) => ({
                              ...current,
                              questions: current.questions.filter((item) => item.id !== question.id).map((item, index) => ({
                                ...item,
                                display_order: index + 1,
                              })),
                            }))
                          }
                          type="button"
                          variant="outline"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Key</label>
                          <input className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                            ...current,
                            questions: current.questions.map((item) => item.id === question.id ? { ...item, key: event.target.value } : item),
                          }))} value={question.key} />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                          <select className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                            ...current,
                            questions: current.questions.map((item) => item.id === question.id ? {
                              ...item,
                              question_type: event.target.value as AdminQuestionnaireQuestionInput['question_type'],
                              options: ['single_select', 'multi_select'].includes(event.target.value) ? (item.options?.length ? item.options : [createEmptyOption(1)]) : [],
                            } : item),
                          }))} value={question.question_type}>
                            <option value="single_select">Single select</option>
                            <option value="multi_select">Multi select</option>
                            <option value="text">Free text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-foreground">Prompt</label>
                        <textarea className="min-h-[5rem] w-full rounded-[1rem] border border-input px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                          ...current,
                          questions: current.questions.map((item) => item.id === question.id ? { ...item, prompt: event.target.value } : item),
                        }))} value={question.prompt} />
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Helper text</label>
                          <input className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                            ...current,
                            questions: current.questions.map((item) => item.id === question.id ? { ...item, helper_text: event.target.value } : item),
                          }))} value={question.helper_text ?? ''} />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Context key</label>
                          <input className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                            ...current,
                            questions: current.questions.map((item) => item.id === question.id ? { ...item, context_key: event.target.value } : item),
                          }))} placeholder="use_case, team_size, budget, priorities" value={question.context_key ?? ''} />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-3 rounded-[1rem] border border-input px-4 py-3 text-sm text-foreground">
                            <input checked={question.required} onChange={(event) => setEditorState((current) => ({
                              ...current,
                              questions: current.questions.map((item) => item.id === question.id ? { ...item, required: event.target.checked } : item),
                            }))} type="checkbox" />
                            Required question
                          </label>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Default next question</label>
                          <select className="h-11 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                            ...current,
                            questions: current.questions.map((item) => item.id === question.id ? { ...item, default_next_question_id: event.target.value || undefined } : item),
                          }))} value={question.default_next_question_id ?? ''}>
                            <option value="">End questionnaire</option>
                            {questionSelectOptions.filter((item) => item.id !== question.id).map((option) => (
                              <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {['single_select', 'multi_select'].includes(question.question_type) ? (
                        <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-white p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h5 className="text-base font-semibold text-foreground">Options</h5>
                              <p className="text-sm text-muted-foreground">Selectable values stored in structured answers.</p>
                            </div>
                            <Button onClick={() => setEditorState((current) => ({
                              ...current,
                              questions: current.questions.map((item) => item.id === question.id ? {
                                ...item,
                                options: [...(item.options ?? []), createEmptyOption((item.options?.length ?? 0) + 1)],
                              } : item),
                            }))} type="button" variant="outline">Add option</Button>
                          </div>
                          <div className="mt-4 space-y-3">
                            {(question.options ?? []).map((option) => (
                              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={option.id}>
                                <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    options: (item.options ?? []).map((candidate) => candidate.id === option.id ? { ...candidate, label: event.target.value } : candidate),
                                  } : item),
                                }))} placeholder="Label" value={option.label} />
                                <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    options: (item.options ?? []).map((candidate) => candidate.id === option.id ? { ...candidate, value: event.target.value } : candidate),
                                  } : item),
                                }))} placeholder="Stored value" value={option.value} />
                                <Button onClick={() => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    options: (item.options ?? []).filter((candidate) => candidate.id !== option.id).map((candidate, index) => ({ ...candidate, display_order: index + 1 })),
                                  } : item),
                                }))} type="button" variant="outline">Remove</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h5 className="text-base font-semibold text-foreground">Branches</h5>
                            <p className="text-sm text-muted-foreground">Ordered single-condition rules checked before the default next question.</p>
                          </div>
                          <Button onClick={() => setEditorState((current) => ({
                            ...current,
                            questions: current.questions.map((item) => item.id === question.id ? {
                              ...item,
                              branches: [...(item.branches ?? []), createEmptyBranch((item.branches?.length ?? 0) + 1)],
                            } : item),
                          }))} type="button" variant="outline">Add branch</Button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(question.branches ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No branch rules yet. The default next question will be used.</p>
                          ) : (
                            (question.branches ?? []).map((branch) => (
                              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" key={branch.id}>
                                <select className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    branches: (item.branches ?? []).map((candidate) => candidate.id === branch.id ? { ...candidate, source_question_key: event.target.value || undefined } : candidate),
                                  } : item),
                                }))} value={branch.source_question_key ?? ''}>
                                  <option value="">Current question</option>
                                  {editorState.questions.filter((item) => item.id !== question.id).map((candidate) => (
                                    <option key={candidate.id} value={candidate.key}>{candidate.key}</option>
                                  ))}
                                </select>
                                <select className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    branches: (item.branches ?? []).map((candidate) => candidate.id === branch.id ? { ...candidate, operator: event.target.value as AdminQuestionnaireBranchInput['operator'] } : candidate),
                                  } : item),
                                }))} value={branch.operator}>
                                  <option value="equals">equals</option>
                                  <option value="contains">contains</option>
                                  <option value="greater_than">greater than</option>
                                  <option value="less_than">less than</option>
                                  <option value="in">in list</option>
                                </select>
                                <input className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    branches: (item.branches ?? []).map((candidate) => candidate.id === branch.id ? { ...candidate, expected_value: event.target.value } : candidate),
                                  } : item),
                                }))} placeholder="Expected value" value={String(branch.expected_value ?? '')} />
                                <select className="h-11 rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    branches: (item.branches ?? []).map((candidate) => candidate.id === branch.id ? { ...candidate, next_question_id: event.target.value || undefined } : candidate),
                                  } : item),
                                }))} value={branch.next_question_id ?? ''}>
                                  <option value="">End questionnaire</option>
                                  {questionSelectOptions.filter((option) => option.id !== question.id).map((option) => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                  ))}
                                </select>
                                <Button onClick={() => setEditorState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => item.id === question.id ? {
                                    ...item,
                                    branches: (item.branches ?? []).filter((candidate) => candidate.id !== branch.id).map((candidate, index) => ({ ...candidate, display_order: index + 1 })),
                                  } : item),
                                }))} type="button" variant="outline">Remove</Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled={isSaving} type="submit">{isSaving ? 'Saving...' : selectedId ? 'Save draft' : 'Create draft'}</Button>
                  {selectedMeta?.is_active ? <span className="text-sm text-muted-foreground">Active questionnaires are locked to preserve historical submissions.</span> : null}
                </div>
              </form>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Validation</h2>
                <p className="mt-1 text-sm text-muted-foreground">Activation requires a loop-free questionnaire with valid question references.</p>
                {!validation ? (
                  <p className="mt-4 rounded-[1.25rem] bg-[#faf6ee] p-4 text-sm text-muted-foreground">Run validation to check branch targets, loops, and unreachable questions.</p>
                ) : validation.valid ? (
                  <p className="mt-4 rounded-[1.25rem] bg-[#f3f8f5] p-4 text-sm text-[#1b5c40]">Questionnaire validation passed.</p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm text-[#7d3d2f]">
                    {validation.errors.map((error) => (
                      <li className="rounded-[1rem] bg-[#fff4f1] px-4 py-3" key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[2rem] border border-border bg-white p-6 shadow-[0_18px_60px_rgba(67,47,31,0.08)]">
                <h2 className="text-2xl font-semibold text-foreground">Preview</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ordered public-facing question list for a safe pre-activation check.</p>
                {!preview ? (
                  <p className="mt-4 rounded-[1.25rem] bg-[#faf6ee] p-4 text-sm text-muted-foreground">Run preview to inspect the public question flow skeleton.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[1.25rem] bg-[#faf6ee] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public quiz</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{preview.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">/{preview.slug}</p>
                    </div>
                    {preview.questions.map((question) => (
                      <div className="rounded-[1.25rem] border border-border/80 p-4" key={question.id}>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step {question.display_order}</p>
                        <p className="mt-2 font-medium text-foreground">{question.prompt}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{question.question_type.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}