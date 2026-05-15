import type {
  AdminQuestionnaireDetail,
  AdminQuestionnaireInput,
  AdminQuestionnaireQuestionInput,
  AdminQuestionnaireValidationResult,
  PublicQuestionnaire,
} from '@/types/admin';
import type { CollectedContext } from '@/types/chat';
import { SUPPORTED_USE_CASES } from '@/lib/ai/constants';

type QuestionnairePayloadValidation = {
  data?: AdminQuestionnaireInput;
  errors: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isQuestionType(value: unknown): value is AdminQuestionnaireQuestionInput['question_type'] {
  return [
    'single_select',
    'multi_select',
    'text',
    'number',
    'boolean',
  ].includes(String(value));
}

function isBranchOperator(value: unknown) {
  return ['equals', 'contains', 'greater_than', 'less_than', 'in'].includes(String(value));
}

function isSelectQuestion(question: Pick<AdminQuestionnaireQuestionInput, 'question_type'>) {
  return ['single_select', 'multi_select'].includes(question.question_type);
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeExpectedValue(value: unknown): string | number | boolean | string[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return '';
}

function sortQuestions(detail: Pick<AdminQuestionnaireDetail, 'questions'>) {
  return [...detail.questions].sort((left, right) => left.display_order - right.display_order);
}

export function validateAdminQuestionnaireInput(payload: unknown): QuestionnairePayloadValidation {
  const errors: Record<string, string> = {};

  if (!isRecord(payload)) {
    return { errors: { form: 'Invalid questionnaire input.' } };
  }

  const name = normalizeText(payload.name);
  const slug = normalizeText(payload.slug);
  const category = normalizeText(payload.category);
  const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];

  if (!name) {
    errors.name = 'Name is required.';
  }

  if (!slug) {
    errors.slug = 'Slug is required.';
  }

  if (!category) {
    errors.category = 'Category is required.';
  } else if (!SUPPORTED_USE_CASES.includes(category as (typeof SUPPORTED_USE_CASES)[number])) {
    errors.category = 'Category is invalid.';
  }

  if (rawQuestions.length === 0) {
    errors.questions = 'At least one question is required.';
  }

  const questions = rawQuestions
    .filter(isRecord)
    .map((question, index) => {
      const prompt = normalizeText(question.prompt);
      const key = normalizeText(question.key);
      const questionType = String(question.question_type) as AdminQuestionnaireQuestionInput['question_type'];
      const options = Array.isArray(question.options)
        ? question.options.filter(isRecord).map((option, optionIndex) => ({
            id: normalizeText(option.id) || undefined,
            label: normalizeText(option.label),
            value: normalizeText(option.value),
            display_order:
              typeof option.display_order === 'number' ? option.display_order : optionIndex + 1,
          }))
        : [];
      const branches = Array.isArray(question.branches)
        ? question.branches.filter(isRecord).map((branch, branchIndex) => ({
            id: normalizeText(branch.id) || undefined,
            source_question_key: normalizeText(branch.source_question_key) || undefined,
            operator: String(branch.operator) as 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in',
            expected_value: normalizeExpectedValue(branch.expected_value),
            next_question_id: normalizeText(branch.next_question_id) || undefined,
            display_order:
              typeof branch.display_order === 'number' ? branch.display_order : branchIndex + 1,
          }))
        : [];

      if (!prompt) {
        errors[`question_${index}_prompt`] = 'Question prompt is required.';
      }

      if (!key) {
        errors[`question_${index}_key`] = 'Question key is required.';
      }

      if (!isQuestionType(questionType)) {
        errors[`question_${index}_question_type`] = 'Question type is invalid.';
      }

      if (isSelectQuestion({ question_type: questionType }) && options.length === 0) {
        errors[`question_${index}_options`] = 'Select questions require at least one option.';
      }

      if (options.some((option) => !option.label || !option.value)) {
        errors[`question_${index}_options`] = 'Question options require label and value.';
      }

      if (branches.some((branch) => !isBranchOperator(branch.operator))) {
        errors[`question_${index}_branches`] = 'Question branches contain an invalid operator.';
      }

      return {
        id: normalizeText(question.id) || undefined,
        key,
        prompt,
        helper_text: normalizeText(question.helper_text) || undefined,
        question_type: questionType,
        required: question.required !== false,
        display_order:
          typeof question.display_order === 'number' ? question.display_order : index + 1,
        default_next_question_id: normalizeText(question.default_next_question_id) || undefined,
        context_key: normalizeText(question.context_key) || undefined,
        options,
        branches,
      };
    });

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      name,
      slug,
      category,
      questions,
    },
    errors,
  };
}

export function buildQuestionnaireValidationResult(
  questionnaire: AdminQuestionnaireInput | AdminQuestionnaireDetail,
): AdminQuestionnaireValidationResult {
  const errors: string[] = [];
  const questions = [...questionnaire.questions].sort(
    (left, right) => left.display_order - right.display_order,
  );

  if (questions.length === 0) {
    errors.push('A questionnaire must include at least one question.');
  }

  const ids = new Set<string>();
  const keys = new Set<string>();
  const questionById = new Map<string, AdminQuestionnaireQuestionInput>();
  const sourceQuestionKeys = new Set(questions.map((question) => question.key));

  for (const question of questions) {
    if (!question.id) {
      errors.push(`Question ${question.key} is missing an identifier.`);
    }

    if (question.id) {
      if (ids.has(question.id)) {
        errors.push(`Question id ${question.id} is duplicated.`);
      }

      ids.add(question.id);
      questionById.set(question.id, question);
    }

    if (keys.has(question.key)) {
      errors.push(`Question key ${question.key} is duplicated.`);
    }

    keys.add(question.key);

    if (isSelectQuestion(question) && (!question.options || question.options.length === 0)) {
      errors.push(`Question ${question.key} requires one or more options.`);
    }

    for (const branch of question.branches ?? []) {
      if (!branch.next_question_id) {
        errors.push(`Question ${question.key} has a branch without a next question.`);
        continue;
      }

      if (!ids.has(branch.next_question_id) && !questions.some((item) => item.id === branch.next_question_id)) {
        errors.push(
          `Question ${question.key} branches to missing question ${branch.next_question_id}.`,
        );
      }

      if (branch.source_question_key && !sourceQuestionKeys.has(branch.source_question_key)) {
        errors.push(
          `Question ${question.key} references unknown source question key ${branch.source_question_key}.`,
        );
      }
    }

    if (
      question.default_next_question_id &&
      !questions.some((item) => item.id === question.default_next_question_id)
    ) {
      errors.push(
        `Question ${question.key} has an invalid default next question target ${question.default_next_question_id}.`,
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const adjacency = new Map<string, string[]>();

  for (const question of questions) {
    if (!question.id) {
      continue;
    }

    const nextIds = [
      ...(question.default_next_question_id ? [question.default_next_question_id] : []),
      ...((question.branches ?? [])
        .map((branch) => branch.next_question_id)
        .filter((value): value is string => Boolean(value))),
    ];

    adjacency.set(question.id, nextIds);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();

  function detectCycle(questionId: string): boolean {
    if (visiting.has(questionId)) {
      return true;
    }

    if (visited.has(questionId)) {
      return false;
    }

    visiting.add(questionId);

    for (const nextQuestionId of adjacency.get(questionId) ?? []) {
      if (detectCycle(nextQuestionId)) {
        return true;
      }
    }

    visiting.delete(questionId);
    visited.add(questionId);
    return false;
  }

  const firstQuestionId = questions[0]?.id;

  if (firstQuestionId && detectCycle(firstQuestionId)) {
    errors.push('Questionnaire contains a circular branch or next-question loop.');
  }

  if (firstQuestionId) {
    const reachable = new Set<string>();
    const stack = [firstQuestionId];

    while (stack.length > 0) {
      const currentQuestionId = stack.pop();

      if (!currentQuestionId || reachable.has(currentQuestionId)) {
        continue;
      }

      reachable.add(currentQuestionId);

      for (const nextQuestionId of adjacency.get(currentQuestionId) ?? []) {
        if (!reachable.has(nextQuestionId)) {
          stack.push(nextQuestionId);
        }
      }
    }

    for (const question of questions) {
      if (question.id && !reachable.has(question.id)) {
        errors.push(`Question ${question.key} is unreachable from the questionnaire start.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildQuestionnaireSnapshot(questionnaire: AdminQuestionnaireDetail) {
  const questions = sortQuestions(questionnaire).map((question) => ({
    ...question,
    options: [...(question.options ?? [])].sort(
      (left, right) => left.display_order - right.display_order,
    ),
    branches: [...(question.branches ?? [])].sort(
      (left, right) => left.display_order - right.display_order,
    ),
  }));

  return {
    snapshot_id: `${questionnaire.id}:v${questionnaire.version}`,
    questionnaire: {
      id: questionnaire.id,
      name: questionnaire.name,
      slug: questionnaire.slug,
      category: questionnaire.category,
      version: questionnaire.version,
      questions,
    },
  };
}

export function buildPublicQuestionnaire(questionnaire: AdminQuestionnaireDetail): PublicQuestionnaire {
  const questions = sortQuestions(questionnaire).map((question) => ({
    id: question.id ?? '',
    key: question.key,
    prompt: question.prompt,
    helper_text: question.helper_text,
    question_type: question.question_type,
    required: question.required,
    display_order: question.display_order,
    options: question.options?.map((option) => ({
      id: option.id ?? '',
      label: option.label,
      value: option.value,
    })),
  }));

  return {
    id: questionnaire.id,
    name: questionnaire.name,
    slug: questionnaire.slug,
    category: questionnaire.category,
    version: questionnaire.version,
    first_question_id: questions[0]?.id,
    questions,
  };
}

function evaluateBranch(actualValue: unknown, operator: string, expectedValue: unknown) {
  if (operator === 'equals') {
    return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
  }

  if (operator === 'contains') {
    if (Array.isArray(actualValue)) {
      return actualValue.includes(expectedValue);
    }

    return String(actualValue ?? '').toLowerCase().includes(String(expectedValue).toLowerCase());
  }

  if (operator === 'greater_than') {
    return Number(actualValue) > Number(expectedValue);
  }

  if (operator === 'less_than') {
    return Number(actualValue) < Number(expectedValue);
  }

  if (operator === 'in') {
    return Array.isArray(expectedValue) && expectedValue.includes(actualValue as never);
  }

  return false;
}

export function resolveQuestionnaireAnswer(
  question: AdminQuestionnaireQuestionInput,
  rawValue: unknown,
): { value?: unknown; error?: string } {
  if (question.question_type === 'boolean') {
    if (typeof rawValue !== 'boolean') {
      return { error: 'Boolean questions require a true or false answer.' };
    }

    return { value: rawValue };
  }

  if (question.question_type === 'number') {
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);

    if (Number.isNaN(numericValue)) {
      return { error: 'Numeric questions require a valid number.' };
    }

    return { value: numericValue };
  }

  if (question.question_type === 'text') {
    const textValue = normalizeText(rawValue);

    if (question.required && !textValue) {
      return { error: 'This question is required.' };
    }

    return { value: textValue };
  }

  const optionValues = new Set((question.options ?? []).map((option) => option.value));

  if (question.question_type === 'single_select') {
    const selectedValue = normalizeText(rawValue);

    if (!selectedValue || !optionValues.has(selectedValue)) {
      return { error: 'Please choose one of the available options.' };
    }

    return { value: selectedValue };
  }

  if (!Array.isArray(rawValue)) {
    return { error: 'Multi-select questions require an array of values.' };
  }

  const selectedValues = rawValue.map((item) => normalizeText(item)).filter(Boolean);

  if (question.required && selectedValues.length === 0) {
    return { error: 'Select at least one option.' };
  }

  if (selectedValues.some((value) => !optionValues.has(value))) {
    return { error: 'One or more selected values are invalid.' };
  }

  return { value: selectedValues };
}

export function resolveNextQuestionId(
  questionnaire: AdminQuestionnaireDetail,
  currentQuestionId: string,
  answers: Record<string, unknown>,
) {
  const question = questionnaire.questions.find((item) => item.id === currentQuestionId);

  if (!question) {
    return undefined;
  }

  const orderedBranches = [...(question.branches ?? [])].sort(
    (left, right) => left.display_order - right.display_order,
  );

  for (const branch of orderedBranches) {
    const sourceKey = branch.source_question_key ?? question.key;
    const actualValue = answers[sourceKey];

    if (evaluateBranch(actualValue, branch.operator, branch.expected_value)) {
      return branch.next_question_id;
    }
  }

  return question.default_next_question_id;
}

export function mapQuestionnaireAnswersToContext(
  questionnaire: AdminQuestionnaireDetail,
  answers: Record<string, unknown>,
): CollectedContext {
  const context: CollectedContext = {};

  for (const question of questionnaire.questions) {
    const rawValue = answers[question.key];

    if (typeof rawValue === 'undefined') {
      continue;
    }

    const targetKey = question.context_key ?? question.key;

    if (targetKey === 'use_case' || targetKey === 'useCase') {
      context.useCase = String(rawValue);
    }

    if (targetKey === 'team_size' || targetKey === 'teamSize') {
      context.teamSize = String(rawValue);
    }

    if (targetKey === 'budget') {
      context.budget = String(rawValue);
    }

    if (targetKey === 'priorities') {
      context.priorities = Array.isArray(rawValue) ? rawValue.map(String) : [String(rawValue)];
    }
  }

  return context;
}