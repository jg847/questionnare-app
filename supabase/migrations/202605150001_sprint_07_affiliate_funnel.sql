create table if not exists questionnaires (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  version integer not null default 1,
  status text not null default 'draft',
  is_active boolean not null default false,
  published_snapshot_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionnaires_slug_unique unique (slug),
  constraint questionnaires_status_valid check (status in ('draft', 'active', 'inactive'))
);

create unique index if not exists questionnaires_one_active_idx
  on questionnaires (is_active)
  where is_active = true;

create table if not exists questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id) on delete cascade,
  key text not null,
  prompt text not null,
  helper_text text,
  question_type text not null,
  required boolean not null default true,
  display_order integer not null,
  default_next_question_id uuid references questionnaire_questions(id) on delete set null,
  context_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionnaire_questions_type_valid check (
    question_type in ('single_select', 'multi_select', 'text', 'number', 'boolean')
  ),
  constraint questionnaire_questions_key_unique unique (questionnaire_id, key),
  constraint questionnaire_questions_display_order_unique unique (questionnaire_id, display_order)
);

create index if not exists questionnaire_questions_questionnaire_id_idx
  on questionnaire_questions (questionnaire_id, display_order);

create table if not exists questionnaire_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questionnaire_questions(id) on delete cascade,
  label text not null,
  value text not null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  constraint questionnaire_options_display_order_unique unique (question_id, display_order)
);

create index if not exists questionnaire_options_question_id_idx
  on questionnaire_options (question_id, display_order);

create table if not exists questionnaire_branches (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questionnaire_questions(id) on delete cascade,
  source_question_key text,
  operator text not null,
  expected_value_json jsonb not null,
  next_question_id uuid references questionnaire_questions(id) on delete set null,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  constraint questionnaire_branches_operator_valid check (
    operator in ('equals', 'contains', 'greater_than', 'less_than', 'in')
  )
);

create index if not exists questionnaire_branches_question_id_idx
  on questionnaire_branches (question_id, display_order);

create table if not exists questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id) on delete restrict,
  questionnaire_version integer not null,
  questionnaire_snapshot_id text not null,
  session_id text not null,
  current_question_id uuid references questionnaire_questions(id) on delete set null,
  answers_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_interaction_at timestamptz not null default now()
);

create index if not exists questionnaire_submissions_questionnaire_id_idx
  on questionnaire_submissions (questionnaire_id);
create index if not exists questionnaire_submissions_session_id_idx
  on questionnaire_submissions (session_id);
create index if not exists questionnaire_submissions_started_at_idx
  on questionnaire_submissions (started_at);

create table if not exists questionnaire_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references questionnaire_submissions(id) on delete cascade,
  question_id uuid references questionnaire_questions(id) on delete set null,
  question_key text not null,
  value_json jsonb not null,
  answered_at timestamptz not null default now(),
  constraint questionnaire_answers_submission_question_key_unique unique (submission_id, question_key)
);

create index if not exists questionnaire_answers_submission_id_idx
  on questionnaire_answers (submission_id);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  network text,
  default_currency text not null default 'USD',
  commission_model text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_slug_unique unique (slug)
);

create index if not exists partners_is_active_idx on partners (is_active);

create table if not exists conversions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete set null,
  offer_id uuid references offers(id) on delete set null,
  click_id uuid references clicks(id) on delete set null,
  sub_id text,
  partner_conversion_id text,
  status text not null,
  conversion_value numeric(12, 2),
  commission_value numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  source_type text not null default 'manual',
  source_payload jsonb not null default '{}'::jsonb,
  attribution_state text not null,
  notes text,
  constraint conversions_status_valid check (status in ('pending', 'approved', 'rejected', 'paid')),
  constraint conversions_attribution_state_valid check (
    attribution_state in ('matched', 'unmatched', 'manual_match', 'duplicate_rejected')
  )
);

create unique index if not exists conversions_partner_conversion_unique_idx
  on conversions (partner_id, partner_conversion_id)
  where partner_conversion_id is not null;

create index if not exists conversions_offer_id_idx on conversions (offer_id);
create index if not exists conversions_click_id_idx on conversions (click_id);
create index if not exists conversions_sub_id_idx on conversions (sub_id);
create index if not exists conversions_occurred_at_idx on conversions (occurred_at);
create index if not exists conversions_attribution_state_idx on conversions (attribution_state);