# Spec: Questionnaire Builder and Branching

**ID:** SPEC-11  
**Status:** Draft  
**Sprint:** 7

## Summary

This spec defines the configurable questionnaire system for ToolMatch AI. It expands the current guided recommendation flow into an admin-manageable questionnaire builder with branching logic, typed answer capture, scoring signals, and a runtime execution engine that can drive either a classic step-by-step quiz or a hybrid conversational flow.

## User Stories

- As a visitor, I want a guided questionnaire that adapts to my answers so that I can reach relevant recommendations faster.
- As an admin, I want to create and update questions and branch rules without code changes so that the funnel can be improved over time.
- As a product owner, I want structured answer data captured consistently so that recommendations, analytics, and conversion analysis can improve.

## MVP Scope

### Must Exist for This Spec

- A questionnaire data model that supports ordered questions and branching rules
- An admin questionnaire builder for creating, editing, activating, and previewing questionnaires
- Support for common question types such as single-select, multi-select, free-text, numeric, and boolean
- Runtime branching logic that determines the next question from prior answers
- Persistence for questionnaire definitions, question definitions, answer options, and user responses
- A public questionnaire runtime that can execute a published questionnaire deterministically
- Mapping from structured questionnaire responses into recommendation context fields such as use case, team size, budget, and priorities
- Analytics for questionnaire starts, question progression, completion, abandonment, and recommendation generation after completion

### Can Be Stubbed or Deferred

- Visual drag-and-drop flowchart editing
- Arbitrary nested condition builders beyond a constrained branching rule format
- Multi-language questionnaire localization
- Version diff tooling or rollback beyond active/inactive questionnaire management
- AI-authored questionnaire generation from prompts
- Per-question experimentation or multivariate quiz optimization

### Assumptions

- The existing recommendation engine and chat context model remain the source of truth for recommendation output.
- The questionnaire builder is a post-MVP enhancement and must not reopen the original two-week scope.
- Admin protection is provided by [docs/_spec/SPEC-06-admin-authentication.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-06-admin-authentication.md).
- Offer management and analytics foundations already exist from [docs/_spec/SPEC-07-admin-offer-catalog-management.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-07-admin-offer-catalog-management.md) and [docs/_spec/SPEC-09-analytics-dashboard.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-09-analytics-dashboard.md).
- The public experience may support both quiz-first and chat-first entry points, but this spec focuses on the structured quiz foundation.

## Functional Requirements

1. Implement a configurable questionnaire system that supports admin-managed question flows.
2. Support questionnaire entities that can be drafted, activated, and deactivated without deleting historical submissions.
3. Support question types at minimum: single-select, multi-select, free-text, numeric, and boolean.
4. Each question must support a stable identifier, prompt text, helper text when present, required flag, question type, and display order.
5. Select-type questions must support configurable answer options with labels and stored values.
6. The questionnaire system must support branching logic that determines the next question based on the current answer and, when needed, a constrained set of previously captured answers.
7. Branching logic must be deterministic and must resolve to at most one next-question path at runtime for a given response state.
8. The system must support a default next question when no branch rule matches.
9. The runtime engine must validate that published questionnaires do not contain broken references, orphaned steps, or impossible branch targets.
10. The runtime engine must prevent infinite loops caused by invalid branch configurations.
11. User responses must be persisted in a structured form linked to the questionnaire submission or recommendation session.
12. Structured responses must be transformable into the existing recommendation context fields used by the recommendation engine.
13. The questionnaire runtime must support resumable progress within the browser session for the active submission.
14. The public UI must expose a step-based questionnaire flow with clear progress and next/back interactions.
15. The public UI must handle branch-driven question changes without losing already valid prior answers.
16. An admin questionnaire builder UI must exist for list, create, edit, activate, and preview flows.
17. Admin preview mode must allow safe testing of a questionnaire without marking it as live.
18. Questionnaire pages and APIs must require authenticated admin access when used for management workflows.
19. The system must emit analytics events for `questionnaire_started`, `question_answered`, `questionnaire_completed`, and `questionnaire_abandoned`.
20. Questionnaire analytics must remain compatible with the existing recommendation and click analytics foundation.
21. The system must preserve historical questionnaire definitions or snapshots sufficiently to interpret old submissions even after later edits.
22. Each submission must be bound to a questionnaire version or immutable snapshot identifier so historical answers can be interpreted against the exact definition that produced them.
23. Validation errors in questionnaire definitions must be surfaced clearly before activation.
24. The builder must support marking one questionnaire as active for the public runtime.
25. The questionnaire system must support mapping answer values to recommendation-relevant concepts such as use case, budget, team size, and priorities.
26. The runtime must remain compatible with future hybrid flows where questionnaire outputs are handed off to the conversational assistant.

## Non-Functional Requirements

- Keep the first version operationally simple and deterministic.
- Prefer explicit typed question and branch contracts over overly flexible schema-less logic.
- Preserve historical submission readability when questionnaires evolve.
- Avoid visual-builder complexity that materially slows implementation without strengthening the hiring-signal demo.
- Make questionnaire validation and runtime behavior straightforward to test.

## Data Model

Suggested persistence entities:

- `questionnaires`
- `questionnaire_questions`
- `questionnaire_options`
- `questionnaire_branches`
- `questionnaire_submissions`
- `questionnaire_answers`

Suggested high-level fields:

- `questionnaires.id`
- `questionnaires.name`
- `questionnaires.slug`
- `questionnaires.is_active`
- `questionnaires.version`
- `questionnaires.published_snapshot_json`
- `questionnaire_questions.id`
- `questionnaire_questions.questionnaire_id`
- `questionnaire_questions.key`
- `questionnaire_questions.prompt`
- `questionnaire_questions.question_type`
- `questionnaire_questions.required`
- `questionnaire_questions.display_order`
- `questionnaire_questions.default_next_question_id`
- `questionnaire_options.question_id`
- `questionnaire_options.label`
- `questionnaire_options.value`
- `questionnaire_branches.question_id`
- `questionnaire_branches.source_question_key`
- `questionnaire_branches.operator`
- `questionnaire_branches.expected_value`
- `questionnaire_branches.next_question_id`
- `questionnaire_submissions.id`
- `questionnaire_submissions.questionnaire_id`
- `questionnaire_submissions.questionnaire_version`
- `questionnaire_submissions.questionnaire_snapshot_id`
- `questionnaire_submissions.session_id`
- `questionnaire_submissions.completed_at`
- `questionnaire_answers.submission_id`
- `questionnaire_answers.question_id`
- `questionnaire_answers.value_json`

Historical submissions must remain interpretable even when a questionnaire is later edited.

Minimum implementation rule for versioning:

- activating a questionnaire must freeze an immutable published snapshot of questions, options, and branch rules
- each submission must reference that published snapshot or questionnaire version
- later admin edits must create a new version rather than mutating the definition used by existing submissions

## API Contract

Suggested protected admin endpoints:

- `GET /api/admin/questionnaires`
- `GET /api/admin/questionnaires/:id`
- `POST /api/admin/questionnaires`
- `PATCH /api/admin/questionnaires/:id`
- `POST /api/admin/questionnaires/:id/activate`
- `POST /api/admin/questionnaires/:id/validate`
- `POST /api/admin/questionnaires/:id/preview`

Suggested public runtime endpoints:

- `GET /api/questionnaires/active`
- `POST /api/questionnaires/submissions`
- `PATCH /api/questionnaires/submissions/:id`
- optional `POST /api/questionnaires/submissions/:id/complete`

Suggested admin questionnaire shape:

```ts
type AdminQuestionnaire = {
  id: string;
  name: string;
  slug: string;
  version: number;
  is_active: boolean;
  questions: Array<{
    id: string;
    key: string;
    prompt: string;
    helper_text?: string;
    question_type: 'single_select' | 'multi_select' | 'text' | 'number' | 'boolean';
    required: boolean;
    display_order: number;
    default_next_question_id?: string;
    options?: Array<{
      id: string;
      label: string;
      value: string;
    }>;
    branches?: Array<{
      id: string;
      source_question_key?: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
      expected_value: string | number | boolean | string[];
      next_question_id: string;
    }>;
  }>;
};
```

Branching contract notes:

- `source_question_key` omitted means the branch evaluates the current question's answer
- `source_question_key` present means the branch evaluates one prior captured answer by key
- first-version branching must stay deterministic and constrained to single-condition rules, with ordered evaluation and a default next question
- if multi-answer branching is needed, it must be modeled as ordered single-condition rules against previously captured answers rather than an unbounded condition-builder UI

Suggested public submission shape:

```ts
type QuestionnaireSubmission = {
  submission_id: string;
  questionnaire_id: string;
  current_question_id?: string;
  answers: Record<string, unknown>;
  completed: boolean;
};
```

Behavior requirements:

- public runtime endpoints must only expose the active questionnaire
- admin endpoints must remain protected by SPEC-06
- activation must enforce a single active questionnaire
- validation must reject invalid branch targets and loops before activation

## UI/UX Notes

- The public questionnaire should feel faster and more guided than the current general chat opener.
- Progress should be visible so users know the questionnaire is finite.
- Branching should shorten the path rather than making the funnel feel more complex.
- The builder UI should prioritize clarity and correctness over visual flourish.
- Admin preview should show exactly how the public flow will behave for sample answers.

## Design Patterns

- **State Machine:** the questionnaire runtime should behave like a controlled step engine that resolves state and next transitions deterministically.
- **Repository:** questionnaire definitions, submissions, and answers should be loaded through dedicated data-access modules.
- **Builder:** admin questionnaire creation and editing can be modeled as composition of questions, options, and branches into a validated runtime artifact.
- **Strategy:** answer-to-context mapping should be separable from the questionnaire runtime so recommendation logic can evolve independently.

## Test Cases

### Unit Tests

- Positive: branch resolution returns the correct next question for representative answer states.
- Positive: default next-question logic works when no branch rule matches.
- Negative: invalid branch references are rejected by validation.
- Negative: loop detection catches circular question graphs.
- Edge: multi-select and numeric question values serialize and deserialize correctly.
- Edge: answer-to-context mapping produces the expected recommendation context fields.

### Integration Tests

- Positive: an authenticated admin can create and update a questionnaire definition.
- Positive: activation enforces a single active questionnaire.
- Positive: the public runtime serves the active questionnaire and persists answers.
- Positive: questionnaire completion can feed the recommendation context pipeline.
- Negative: unauthenticated questionnaire-admin requests are denied.
- Negative: invalid questionnaires cannot be activated.
- Edge: partial submissions resume safely in-session.

### E2E Tests

- Positive: a user can complete a branching questionnaire and receive recommendations.
- Positive: branch-driven questions change based on the user's answers.
- Positive: an admin can create, preview, and activate a questionnaire.
- Negative: broken questionnaire definitions are blocked before activation.
- Edge: abandonment and resume behavior preserve valid prior answers.

## Acceptance Criteria

- [ ] A configurable questionnaire system exists with admin-managed questions and branches.
- [ ] The public runtime can execute an active questionnaire deterministically.
- [ ] Branching logic supports default and conditional next-question behavior.
- [ ] Structured answers are persisted and can be mapped into recommendation context.
- [ ] Admin questionnaire routes and APIs are protected.
- [ ] Invalid questionnaire graphs are blocked from activation.
- [ ] One questionnaire can be marked active for the public runtime.
- [ ] Admin preview exists and is isolated from the live questionnaire.
- [ ] Questionnaire analytics cover start, answer, completion, and abandonment events.
- [ ] Unit, integration, and E2E tests cover branching, validation, persistence, activation, and public completion flows.

## Sprint Tasks

1. Define the questionnaire data model for definitions, branches, submissions, and answers.
2. Implement questionnaire validation for broken references, unreachable nodes, and loops.
3. Implement the public questionnaire runtime and in-session progress persistence.
4. Implement answer-to-context mapping for recommendation inputs.
5. Implement admin questionnaire list, detail, create, edit, activate, validate, and preview flows.
6. Emit questionnaire lifecycle analytics events for start, answer, completion, and abandonment.
7. Verify compatibility with the existing recommendation engine and analytics foundations.
8. Add unit, integration, and E2E coverage for branching, activation, validation, submissions, and completion.