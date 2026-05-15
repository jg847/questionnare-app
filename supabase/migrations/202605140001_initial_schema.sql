create extension if not exists pgcrypto;

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null,
  category text not null,
  tags text[] not null default '{}',
  affiliate_url text not null,
  logo_url text,
  pricing_model text,
  commission_info text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_slug_unique unique (slug)
);

create index if not exists offers_is_active_idx on offers (is_active);
create index if not exists offers_category_active_idx on offers (category, is_active);

create table if not exists system_prompts (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  content text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint system_prompts_version_unique unique (version)
);

create unique index if not exists system_prompts_one_active_idx
  on system_prompts (is_active)
  where is_active = true;

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  recommendation_generated boolean not null default false
);

create index if not exists conversations_session_id_idx on conversations (session_id);
create index if not exists conversations_created_at_idx on conversations (created_at);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_role_valid check (role in ('user', 'assistant'))
);

create index if not exists messages_conversation_created_at_idx
  on messages (conversation_id, created_at);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  offer_id uuid not null references offers(id) on delete restrict,
  rank integer not null,
  match_reason text not null,
  match_score integer not null,
  created_at timestamptz not null default now(),
  constraint recommendations_rank_positive check (rank > 0),
  constraint recommendations_match_score_range check (match_score between 0 and 100),
  constraint recommendations_conversation_rank_unique unique (conversation_id, rank)
);

create index if not exists recommendations_conversation_id_idx
  on recommendations (conversation_id);
create index if not exists recommendations_offer_id_idx on recommendations (offer_id);

create table if not exists clicks (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid references recommendations(id) on delete set null,
  offer_id uuid not null references offers(id) on delete restrict,
  session_id text not null,
  sub_id text not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists clicks_offer_id_idx on clicks (offer_id);
create index if not exists clicks_session_id_idx on clicks (session_id);
create index if not exists clicks_created_at_idx on clicks (created_at);
create index if not exists clicks_sub_id_idx on clicks (sub_id);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on analytics_events (event_name);
create index if not exists analytics_events_session_id_idx on analytics_events (session_id);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at);