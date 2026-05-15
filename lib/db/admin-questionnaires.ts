import 'server-only';

import { buildFallbackRecommendations } from '@/lib/ai/recommendation-engine';
import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';
import {
  createConversation,
  getActiveOffers,
  insertAnalyticsEvent,
  markConversationRecommended,
  saveRecommendations,
} from '@/lib/db/chat-repository';
import {
  buildPublicQuestionnaire,
  buildQuestionnaireSnapshot,
  buildQuestionnaireValidationResult,
  mapQuestionnaireAnswersToContext,
  resolveNextQuestionId,
  resolveQuestionnaireAnswer,
} from '@/lib/questionnaire/runtime';
import type {
  AdminQuestionnaireDetail,
  AdminQuestionnaireInput,
  AdminQuestionnaireListItem,
  PublicQuestionnaire,
  QuestionnaireSubmissionResponse,
} from '@/types/admin';
import type {
  QuestionnaireBranchRecord,
  QuestionnaireOptionRecord,
  QuestionnaireQuestionRecord,
  QuestionnaireRecord,
  QuestionnaireSubmissionRecord,
} from '@/types/database';

type QuestionnaireBaseRow = QuestionnaireRecord;

const QUESTIONNAIRE_SELECT_WITH_CATEGORY =
  'id, name, slug, category, version, status, is_active, published_snapshot_json, created_at, updated_at' as const;
const QUESTIONNAIRE_SELECT_LEGACY =
  'id, name, slug, version, status, is_active, published_snapshot_json, created_at, updated_at' as const;
const QUESTIONNAIRE_LIST_SELECT_WITH_CATEGORY =
  'id, name, slug, category, version, status, is_active, updated_at' as const;
const QUESTIONNAIRE_LIST_SELECT_LEGACY =
  'id, name, slug, version, status, is_active, updated_at' as const;

let questionnaireCategoryColumnSupport: boolean | null = null;

function createId() {
  return crypto.randomUUID();
}

function isMissingCategoryColumnError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';
  const message = 'message' in error ? String((error as { message?: string }).message) : '';
  return code === '42703' || message.includes('questionnaires.category');
}

async function supportsQuestionnaireCategoryColumn() {
  if (questionnaireCategoryColumnSupport !== null) {
    return questionnaireCategoryColumnSupport;
  }

  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase.from('questionnaires').select('category').limit(1);

  if (result.error) {
    if (isMissingCategoryColumnError(result.error)) {
      questionnaireCategoryColumnSupport = false;
      return false;
    }

    throw result.error;
  }

  questionnaireCategoryColumnSupport = true;
  return true;
}

function withCategoryFallback<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => ({
    ...row,
    category: typeof row.category === 'string' ? row.category : '',
  }));
}

async function getQuestionnaireListRows() {
  const supabase = createServiceRoleSupabaseClient();
  const hasCategoryColumn = await supportsQuestionnaireCategoryColumn();
  const result = await supabase
    .from('questionnaires')
    .select(hasCategoryColumn ? QUESTIONNAIRE_LIST_SELECT_WITH_CATEGORY : QUESTIONNAIRE_LIST_SELECT_LEGACY)
    .order('updated_at', { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return withCategoryFallback(((result.data as unknown as Array<Record<string, unknown>>) ?? []));
}

async function getQuestionnaireRecordById(id: string) {
  const supabase = createServiceRoleSupabaseClient();
  const hasCategoryColumn = await supportsQuestionnaireCategoryColumn();
  const result = await supabase
    .from('questionnaires')
    .select(hasCategoryColumn ? QUESTIONNAIRE_SELECT_WITH_CATEGORY : QUESTIONNAIRE_SELECT_LEGACY)
    .eq('id', id)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return {
    ...((result.data as unknown as Record<string, unknown>) ?? {}),
    category:
      typeof (result.data as unknown as Record<string, unknown>).category === 'string'
        ? String((result.data as unknown as Record<string, unknown>).category)
        : '',
  } as QuestionnaireBaseRow;
}

async function getQuestionnaireRows(questionnaireId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const [questionsResult, optionsResult, branchesResult] = await Promise.all([
    supabase
      .from('questionnaire_questions')
      .select(
        'id, questionnaire_id, key, prompt, helper_text, question_type, required, display_order, default_next_question_id, context_key, created_at, updated_at',
      )
      .eq('questionnaire_id', questionnaireId)
      .order('display_order', { ascending: true }),
    supabase
      .from('questionnaire_options')
      .select('id, question_id, label, value, display_order')
      .order('display_order', { ascending: true }),
    supabase
      .from('questionnaire_branches')
      .select(
        'id, question_id, source_question_key, operator, expected_value_json, next_question_id, display_order',
      )
      .order('display_order', { ascending: true }),
  ]);

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  if (optionsResult.error) {
    throw optionsResult.error;
  }

  if (branchesResult.error) {
    throw branchesResult.error;
  }

  const questions = ((questionsResult.data as QuestionnaireQuestionRecord[]) ?? []).filter(
    (question) => question.questionnaire_id === questionnaireId,
  );
  const questionIds = new Set(questions.map((question) => question.id));
  const options = ((optionsResult.data as QuestionnaireOptionRecord[]) ?? []).filter((option) =>
    questionIds.has(option.question_id),
  );
  const branches = ((branchesResult.data as QuestionnaireBranchRecord[]) ?? []).filter((branch) =>
    questionIds.has(branch.question_id),
  );

  return { questions, options, branches };
}

function buildAdminQuestionnaireDetail(input: {
  questionnaire: QuestionnaireBaseRow;
  questions: QuestionnaireQuestionRecord[];
  options: QuestionnaireOptionRecord[];
  branches: QuestionnaireBranchRecord[];
}): AdminQuestionnaireDetail {
  const optionsByQuestionId = new Map<string, QuestionnaireOptionRecord[]>();
  const branchesByQuestionId = new Map<string, QuestionnaireBranchRecord[]>();

  for (const option of input.options) {
    optionsByQuestionId.set(option.question_id, [
      ...(optionsByQuestionId.get(option.question_id) ?? []),
      option,
    ]);
  }

  for (const branch of input.branches) {
    branchesByQuestionId.set(branch.question_id, [
      ...(branchesByQuestionId.get(branch.question_id) ?? []),
      branch,
    ]);
  }

  return {
    id: input.questionnaire.id,
    name: input.questionnaire.name,
    slug: input.questionnaire.slug,
    category: input.questionnaire.category ?? '',
    version: input.questionnaire.version,
    status: input.questionnaire.status,
    is_active: input.questionnaire.is_active,
    published_snapshot_json: input.questionnaire.published_snapshot_json,
    created_at: input.questionnaire.created_at,
    updated_at: input.questionnaire.updated_at,
    questions: input.questions.map((question) => ({
      id: question.id,
      key: question.key,
      prompt: question.prompt,
      helper_text: question.helper_text ?? undefined,
      question_type: question.question_type,
      required: question.required,
      display_order: question.display_order,
      default_next_question_id: question.default_next_question_id ?? undefined,
      context_key: question.context_key ?? undefined,
      options: (optionsByQuestionId.get(question.id) ?? []).map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value,
        display_order: option.display_order,
      })),
      branches: (branchesByQuestionId.get(question.id) ?? []).map((branch) => ({
        id: branch.id,
        source_question_key: branch.source_question_key ?? undefined,
        operator: branch.operator,
        expected_value: branch.expected_value_json as string | number | boolean | string[],
        next_question_id: branch.next_question_id ?? undefined,
        display_order: branch.display_order,
      })),
    })),
  };
}

async function replaceQuestionnaireGraph(questionnaireId: string, input: AdminQuestionnaireInput) {
  const supabase = createServiceRoleSupabaseClient();
  const questions = [...input.questions]
    .sort((left, right) => left.display_order - right.display_order)
    .map((question) => ({
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
    }));

  const existingQuestionsResult = await supabase
    .from('questionnaire_questions')
    .select('id')
    .eq('questionnaire_id', questionnaireId);

  if (existingQuestionsResult.error) {
    throw existingQuestionsResult.error;
  }

  const existingQuestionIds = ((existingQuestionsResult.data as Array<{ id: string }>) ?? []).map(
    (row) => row.id,
  );

  if (existingQuestionIds.length > 0) {
    const deleteBranches = await supabase
      .from('questionnaire_branches')
      .delete()
      .in('question_id', existingQuestionIds);

    if (deleteBranches.error) {
      throw deleteBranches.error;
    }

    const deleteOptions = await supabase
      .from('questionnaire_options')
      .delete()
      .in('question_id', existingQuestionIds);

    if (deleteOptions.error) {
      throw deleteOptions.error;
    }

    const deleteQuestions = await supabase
      .from('questionnaire_questions')
      .delete()
      .eq('questionnaire_id', questionnaireId);

    if (deleteQuestions.error) {
      throw deleteQuestions.error;
    }
  }

  if (questions.length === 0) {
    return;
  }

  const insertQuestions = await supabase.from('questionnaire_questions').insert(
    questions.map((question) => ({
      id: question.id,
      questionnaire_id: questionnaireId,
      key: question.key,
      prompt: question.prompt,
      helper_text: question.helper_text ?? null,
      question_type: question.question_type,
      required: question.required,
      display_order: question.display_order,
      default_next_question_id: question.default_next_question_id ?? null,
      context_key: question.context_key ?? null,
      updated_at: new Date().toISOString(),
    })),
  );

  if (insertQuestions.error) {
    throw insertQuestions.error;
  }

  const optionRows = questions.flatMap((question) =>
    (question.options ?? []).map((option) => ({
      id: option.id,
      question_id: question.id,
      label: option.label,
      value: option.value,
      display_order: option.display_order,
    })),
  );

  if (optionRows.length > 0) {
    const insertOptions = await supabase.from('questionnaire_options').insert(optionRows);

    if (insertOptions.error) {
      throw insertOptions.error;
    }
  }

  const branchRows = questions.flatMap((question) =>
    (question.branches ?? []).map((branch) => ({
      id: branch.id,
      question_id: question.id,
      source_question_key: branch.source_question_key ?? null,
      operator: branch.operator,
      expected_value_json: branch.expected_value,
      next_question_id: branch.next_question_id ?? null,
      display_order: branch.display_order,
    })),
  );

  if (branchRows.length > 0) {
    const insertBranches = await supabase.from('questionnaire_branches').insert(branchRows);

    if (insertBranches.error) {
      throw insertBranches.error;
    }
  }
}

export async function listAdminQuestionnaires() {
  const supabase = createServiceRoleSupabaseClient();
  const [questionnaireRows, questionsResult] = await Promise.all([
    getQuestionnaireListRows(),
    supabase.from('questionnaire_questions').select('questionnaire_id'),
  ]);

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  const counts = new Map<string, number>();

  for (const row of (questionsResult.data as Array<{ questionnaire_id: string }>) ?? []) {
    counts.set(row.questionnaire_id, (counts.get(row.questionnaire_id) ?? 0) + 1);
  }

  return (questionnaireRows as Omit<AdminQuestionnaireListItem, 'question_count'>[]).map(
    (item) => ({
      ...item,
      question_count: counts.get(item.id) ?? 0,
    }),
  );
}

export async function getAdminQuestionnaireById(id: string) {
  const data = await getQuestionnaireRecordById(id);
  if (!data) {
    return null;
  }

  const rows = await getQuestionnaireRows(id);
  return buildAdminQuestionnaireDetail({
    questionnaire: data as QuestionnaireBaseRow,
    ...rows,
  });
}

export async function getActiveQuestionnaire(category?: string) {
  const supabase = createServiceRoleSupabaseClient();
  const hasCategoryColumn = await supportsQuestionnaireCategoryColumn();
  let query = supabase
    .from('questionnaires')
    .select(hasCategoryColumn ? QUESTIONNAIRE_SELECT_WITH_CATEGORY : QUESTIONNAIRE_SELECT_LEGACY)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (category && hasCategoryColumn) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const detail = await getAdminQuestionnaireById((data as unknown as QuestionnaireBaseRow).id);
  return detail;
}

export async function createAdminQuestionnaire(input: AdminQuestionnaireInput) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('questionnaires')
    .insert({
      name: input.name,
      slug: input.slug,
      ...(await supportsQuestionnaireCategoryColumn()
        ? { category: input.category }
        : {}),
      version: 1,
      status: 'draft',
      is_active: false,
    })
    .select('id')
    .single();

  if (error) {
    if (isMissingCategoryColumnError(error)) {
      throw new Error('Database migration required: apply the questionnaire category migration before saving category-specific questionnaires.');
    }

    throw error;
  }

  await replaceQuestionnaireGraph((data as { id: string }).id, input);
  return getAdminQuestionnaireById((data as { id: string }).id);
}

export async function updateAdminQuestionnaire(id: string, input: AdminQuestionnaireInput) {
  const existing = await getAdminQuestionnaireById(id);

  if (!existing) {
    return null;
  }

  if (existing.is_active) {
    throw new Error('Active questionnaires are immutable. Create or update a draft instead.');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from('questionnaires')
    .update({
      name: input.name,
      slug: input.slug,
      ...(await supportsQuestionnaireCategoryColumn()
        ? { category: input.category }
        : {}),
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    if (isMissingCategoryColumnError(error)) {
      throw new Error('Database migration required: apply the questionnaire category migration before saving category-specific questionnaires.');
    }

    throw error;
  }

  await replaceQuestionnaireGraph(id, input);
  return getAdminQuestionnaireById(id);
}

export async function validateAdminQuestionnaire(id: string) {
  const detail = await getAdminQuestionnaireById(id);

  if (!detail) {
    return null;
  }

  return buildQuestionnaireValidationResult(detail);
}

export async function activateAdminQuestionnaire(id: string) {
  const detail = await getAdminQuestionnaireById(id);

  if (!detail) {
    return null;
  }

  const validation = buildQuestionnaireValidationResult(detail);

  if (!validation.valid) {
    return { questionnaire: null, validation };
  }

  const supabase = createServiceRoleSupabaseClient();
  const snapshot = buildQuestionnaireSnapshot(detail);
  let deactivateCurrentQuery = supabase
    .from('questionnaires')
    .update({ is_active: false, status: 'inactive', updated_at: new Date().toISOString() })
    .eq('is_active', true);

  if ((await supportsQuestionnaireCategoryColumn()) && detail.category) {
    deactivateCurrentQuery = deactivateCurrentQuery.eq('category', detail.category);
  } else if (await supportsQuestionnaireCategoryColumn()) {
    deactivateCurrentQuery = deactivateCurrentQuery.is('category', null);
  }

  const deactivateCurrent = await deactivateCurrentQuery;

  if (deactivateCurrent.error) {
    throw deactivateCurrent.error;
  }

  const activateResult = await supabase
    .from('questionnaires')
    .update({
      is_active: true,
      status: 'active',
      published_snapshot_json: snapshot,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (activateResult.error) {
    throw activateResult.error;
  }

  return {
    questionnaire: await getAdminQuestionnaireById(id),
    validation,
  };
}

export async function getPublicActiveQuestionnaire(category?: string) {
  const questionnaire = await getActiveQuestionnaire(category);

  if (!questionnaire) {
    return null;
  }

  const snapshotQuestionnaire = questionnaire.published_snapshot_json as
    | {
        questionnaire?: {
          id: string;
          name: string;
          slug: string;
          category: string;
          version: number;
          questions?: Array<{
            id: string;
            key: string;
            prompt: string;
            helper_text?: string;
            question_type: AdminQuestionnaireDetail['questions'][number]['question_type'];
            required: boolean;
            display_order: number;
            options?: Array<{
              id: string;
              label: string;
              value: string;
            }>;
          }>;
        };
      }
    | null;

  if (snapshotQuestionnaire?.questionnaire?.questions?.length) {
    return {
      id: snapshotQuestionnaire.questionnaire.id,
      name: snapshotQuestionnaire.questionnaire.name,
      slug: snapshotQuestionnaire.questionnaire.slug,
      category: snapshotQuestionnaire.questionnaire.category ?? questionnaire.category,
      version: snapshotQuestionnaire.questionnaire.version,
      first_question_id: snapshotQuestionnaire.questionnaire.questions[0]?.id,
      questions: snapshotQuestionnaire.questionnaire.questions.map((question) => ({
        id: question.id,
        key: question.key,
        prompt: question.prompt,
        helper_text: question.helper_text,
        question_type: question.question_type,
        required: question.required,
        display_order: question.display_order,
        options: (question.options ?? []).map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
        })),
      })),
    };
  }

  return buildPublicQuestionnaire(questionnaire);
}

async function getSubmissionById(id: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('questionnaire_submissions')
    .select(
      'id, questionnaire_id, questionnaire_version, questionnaire_snapshot_id, session_id, current_question_id, answers_json, started_at, completed_at, last_interaction_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as QuestionnaireSubmissionRecord | null) ?? null;
}

export async function createQuestionnaireSubmission(sessionId: string, category?: string) {
  const questionnaire = await getActiveQuestionnaire(category);

  if (!questionnaire) {
    throw new Error(category ? 'No active questionnaire is available for this category.' : 'No active questionnaire is available.');
  }

  const firstQuestion = [...questionnaire.questions].sort(
    (left, right) => left.display_order - right.display_order,
  )[0];
  const snapshot = buildQuestionnaireSnapshot(questionnaire);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('questionnaire_submissions')
    .insert({
      questionnaire_id: questionnaire.id,
      questionnaire_version: questionnaire.version,
      questionnaire_snapshot_id: snapshot.snapshot_id,
      session_id: sessionId,
      current_question_id: firstQuestion?.id ?? null,
      answers_json: {},
    })
    .select(
      'id, questionnaire_id, questionnaire_version, questionnaire_snapshot_id, session_id, current_question_id, answers_json, started_at, completed_at, last_interaction_at',
    )
    .single();

  if (error) {
    throw error;
  }

  await insertAnalyticsEvent('questionnaire_started', sessionId, {
    questionnaire_id: questionnaire.id,
    questionnaire_version: questionnaire.version,
    submission_id: (data as QuestionnaireSubmissionRecord).id,
  });

  return {
    submission: data as QuestionnaireSubmissionRecord,
    questionnaire: buildPublicQuestionnaire(questionnaire),
  };
}

export async function advanceQuestionnaireSubmission(input: {
  submissionId: string;
  questionId: string;
  value: unknown;
}) {
  const submission = await getSubmissionById(input.submissionId);

  if (!submission) {
    return null;
  }

  const questionnaire = await getAdminQuestionnaireById(submission.questionnaire_id);

  if (!questionnaire) {
    throw new Error('Questionnaire definition could not be loaded for this submission.');
  }

  const question = questionnaire.questions.find((item) => item.id === input.questionId);

  if (!question || !question.id) {
    throw new Error('Question not found for this questionnaire.');
  }

  const parsedAnswer = resolveQuestionnaireAnswer(question, input.value);

  if (parsedAnswer.error) {
    throw new Error(parsedAnswer.error);
  }

  const answers = {
    ...(submission.answers_json ?? {}),
    [question.key]: parsedAnswer.value,
  };
  const nextQuestionId = resolveNextQuestionId(questionnaire, question.id, answers);
  const completed = !nextQuestionId;
  const supabase = createServiceRoleSupabaseClient();

  const updateSubmission = await supabase
    .from('questionnaire_submissions')
    .update({
      answers_json: answers,
      current_question_id: nextQuestionId ?? null,
      completed_at: completed ? new Date().toISOString() : null,
      last_interaction_at: new Date().toISOString(),
    })
    .eq('id', input.submissionId);

  if (updateSubmission.error) {
    throw updateSubmission.error;
  }

  const upsertAnswer = await supabase.from('questionnaire_answers').upsert(
    {
      submission_id: submission.id,
      question_id: question.id,
      question_key: question.key,
      value_json: parsedAnswer.value,
      answered_at: new Date().toISOString(),
    },
    { onConflict: 'submission_id,question_key' },
  );

  if (upsertAnswer.error) {
    throw upsertAnswer.error;
  }

  await insertAnalyticsEvent('question_answered', submission.session_id, {
    submission_id: submission.id,
    questionnaire_id: questionnaire.id,
    question_id: question.id,
    question_key: question.key,
  });

  let recommendations: QuestionnaireSubmissionResponse['recommendations'];
  let reply: string | undefined;

  if (completed) {
    const context = mapQuestionnaireAnswersToContext(questionnaire, answers);

    if (!context.useCase && questionnaire.category) {
      context.useCase = questionnaire.category;
    }

    const offers = await getActiveOffers();
    const rankedRecommendations = buildFallbackRecommendations(context, offers);
    const conversation = await createConversation(submission.session_id);
    const savedRecommendations = await saveRecommendations(conversation.id, rankedRecommendations);

    await markConversationRecommended(conversation.id);
    await insertAnalyticsEvent('questionnaire_completed', submission.session_id, {
      submission_id: submission.id,
      questionnaire_id: questionnaire.id,
      recommendation_count: savedRecommendations.length,
    });

    recommendations = savedRecommendations.map((item) => ({
      offer_id: item.offer_id,
      recommendation_id: item.recommendation_id ?? '',
      name: item.name,
      description: item.description,
      category: '',
      affiliate_url: item.affiliate_url,
      logo_url: item.logo_url,
      pricing_model: null,
      commission_info: null,
      match_reason: item.match_reason,
      match_score: item.match_score,
      rank: item.rank,
    }));
    reply = 'Your quiz is complete. These are the strongest matches based on your answers.';
  }

  return {
    submission_id: submission.id,
    questionnaire_id: questionnaire.id,
    current_question_id: nextQuestionId ?? undefined,
    answers,
    completed,
    recommendations,
    reply,
  } satisfies QuestionnaireSubmissionResponse;
}

export async function previewQuestionnaire(id: string) {
  const questionnaire = await getAdminQuestionnaireById(id);

  if (!questionnaire) {
    return null;
  }

  return {
    questionnaire: buildPublicQuestionnaire(questionnaire),
    validation: buildQuestionnaireValidationResult(questionnaire),
  };
}

export type { PublicQuestionnaire };