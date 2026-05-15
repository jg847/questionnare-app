# Spec: Database Schema & Migrations

**ID:** SPEC-02  
**Status:** Draft  
**Sprint:** 1

## Summary

This spec defines the PostgreSQL schema for ToolMatch AI and the migration approach used to create and evolve it. The schema must support the MVP recommendation flow, tracked outbound clicks, simple admin catalog management, prompt storage, and lightweight analytics while staying small enough for a 2-week build.

## User Stories

- As a developer, I want a versioned database schema so that application features can be built against stable tables and relationships.
- As an admin, I want offers and prompts stored in a structured way so that the catalog and recommendation behavior can be managed without changing code.
- As a product owner, I want conversations, recommendations, and clicks persisted so that the recommendation flow can be inspected and measured.

## MVP Scope

### Must Exist for MVP

- Versioned SQL migrations under `supabase/migrations/`
- A consistent migration naming/versioning convention, such as timestamp-prefixed SQL filenames
- Core tables: `offers`, `system_prompts`, `conversations`, `messages`, `recommendations`, `clicks`, `analytics_events`
- Primary keys, foreign keys, timestamps, and required indexes for critical lookup paths
- Constraints that protect obvious data integrity issues
- A seed strategy or seed file for initial offers and one active system prompt
- Schema support for soft-deactivating offers through `is_active`

### Can Be Stubbed or Deferred

- Row-level security policies beyond what is necessary for safe MVP development
- Advanced partitioning or archive strategies for analytics tables
- Materialized views for dashboard performance
- Database triggers unless they clearly simplify MVP implementation
- Fine-grained audit history outside the created/updated timestamps required for MVP

### Assumptions

- Supabase PostgreSQL is the source of truth for persistent application data.
- UUID primary keys are acceptable for all main tables.
- Timestamps should use `timestamptz`.
- Tags can be stored as a text array for MVP instead of a normalized join table.
- One active system prompt at a time is sufficient for MVP.

## Functional Requirements

1. Create SQL migrations under `supabase/migrations/` for all required MVP tables.
2. Define the `offers` table with at least: `id`, `name`, `slug`, `description`, `category`, `tags`, `affiliate_url`, `logo_url`, `pricing_model`, `commission_info`, `is_active`, `created_at`, and `updated_at`.
3. Define the `system_prompts` table to support prompt content, versioning metadata, active status, and creation timestamp.
4. Define the `conversations` table to store browser-session-linked chat sessions, creation time, completion time, and whether recommendations were generated.
5. Define the `messages` table to store conversation messages with role, content, and creation timestamp.
6. Define the `recommendations` table to store ranked offer recommendations per conversation, including match reason and match score.
7. Define the `clicks` table to store tracked outbound click events, including recommendation linkage, offer linkage, session identifier, SubID, UTM values, referrer, and creation timestamp.
8. Define the `analytics_events` table to store event name, session identifier, JSON properties, and creation timestamp.
9. Add foreign keys that connect child records to their parent records where appropriate.
10. Add unique constraints where duplicate records would create broken application behavior, including `offers.slug` and prompt version identity.
11. Add a schema-level guarantee that only one system prompt can be active at a time, such as a partial unique index on active prompt state.
12. Add a schema-level constraint for `messages.role` so only approved role values can be stored.
13. Add indexes for critical read paths, including offer lookup by slug and active status, conversation lookup by session identifier, recommendations by conversation, clicks by offer or session, and click lookup by `sub_id`.
14. Ensure the schema supports the analytics event taxonomy and recommendation flow described in the brief.
15. Provide seed data for a small initial offer catalog and one active system prompt.

## Non-Functional Requirements

- Keep the schema simple enough to implement and debug quickly.
- Prefer explicit SQL migrations over implicit schema generation.
- Use names and constraints that make downstream query logic predictable.
- Avoid premature normalization where a simpler structure is sufficient for MVP.
- Preserve room for later additions without forcing a rewrite of the MVP schema.

## Data Model

### `offers`

Purpose: stores software tools that can be recommended.

Suggested columns:

- `id` UUID primary key
- `name` text not null
- `slug` text not null unique
- `description` text not null
- `category` text not null
- `tags` text[] not null default empty array
- `affiliate_url` text not null
- `logo_url` text null
- `pricing_model` text null
- `commission_info` text null
- `is_active` boolean not null default true
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Indexes:

- unique index on `slug`
- index on `is_active`
- composite index on `category, is_active`

### `system_prompts`

Purpose: stores recommendation system prompt content and active versioning state.

Suggested columns:

- `id` UUID primary key
- `version` integer not null unique
- `content` text not null
- `is_active` boolean not null default false
- `created_at` timestamptz not null default now()

Constraints:

- one and only one prompt may be active at a time, enforced at the schema level through a partial unique index or equivalent database constraint

### `conversations`

Purpose: stores chat sessions tied to the browser session identifier.

Suggested columns:

- `id` UUID primary key
- `session_id` text not null
- `created_at` timestamptz not null default now()
- `completed_at` timestamptz null
- `recommendation_generated` boolean not null default false

Indexes:

- index on `session_id`
- index on `created_at`

### `messages`

Purpose: stores individual messages within a conversation.

Suggested columns:

- `id` UUID primary key
- `conversation_id` UUID not null references `conversations(id)` on delete cascade
- `role` text not null
- `content` text not null
- `created_at` timestamptz not null default now()

Constraints:

- `role` must be constrained at the schema level to the MVP-approved values `user` and `assistant`

Indexes:

- index on `conversation_id, created_at`

### `recommendations`

Purpose: stores the ranked offers returned for a conversation.

Suggested columns:

- `id` UUID primary key
- `conversation_id` UUID not null references `conversations(id)` on delete cascade
- `offer_id` UUID not null references `offers(id)` on delete restrict
- `rank` integer not null
- `match_reason` text not null
- `match_score` integer not null
- `created_at` timestamptz not null default now()

Constraints:

- `match_score` should be constrained to 0-100
- rank should be positive
- one conversation should not contain duplicate ranks

Indexes:

- unique index on `conversation_id, rank`
- index on `conversation_id`
- index on `offer_id`

### `clicks`

Purpose: stores outbound click tracking records for recommendation CTAs.

Suggested columns:

- `id` UUID primary key
- `recommendation_id` UUID null references `recommendations(id)` on delete set null
- `offer_id` UUID not null references `offers(id)` on delete restrict
- `session_id` text not null
- `sub_id` text not null
- `utm_source` text not null
- `utm_medium` text not null
- `utm_campaign` text not null
- `referrer` text null
- `created_at` timestamptz not null default now()

Indexes:

- index on `offer_id`
- index on `session_id`
- index on `created_at`
- index on `sub_id`

### `analytics_events`

Purpose: stores lightweight analytics events used by the MVP dashboard and diagnostics.

The MVP analytics foundation should be sufficient to inspect conversation starts, messages, recommendation generation, clicks, admin login success, and offer mutations before the richer dashboard from SPEC-09 exists.

Suggested columns:

- `id` UUID primary key
- `event_name` text not null
- `properties` jsonb not null default '{}'::jsonb
- `session_id` text null
- `created_at` timestamptz not null default now()

Indexes:

- index on `event_name`
- index on `session_id`
- index on `created_at`

## API Contract

No new public API endpoints are introduced directly by this spec.

This spec does define the persistence contract expected by later endpoints, including:

- chat routes that create conversations, messages, and recommendations
- tracking routes that create click records and analytics events
- admin routes that read and update offers and system prompts

## UI/UX Notes

- No end-user UI is delivered by this spec.
- The schema should support quick admin reads and simple public recommendation rendering without requiring complex joins.
- Seeded offers should be varied enough to exercise category and ranking behavior during UI development.

## Design Patterns

- **Repository:** database access for offers, conversations, prompts, recommendations, and clicks should later be encapsulated in repository classes or modules.
- **Single Responsibility:** each table should model one clear business concept rather than mixing unrelated concerns.
- **Open/Closed:** the schema should support later additions such as richer prompt metadata or analytics expansion without breaking core MVP tables.

## Test Cases

### Unit Tests

- Positive: schema-related validation helpers accept valid IDs, scores, and ranking data.
- Negative: invalid match scores, duplicate slugs, or invalid roles are rejected by validation logic or database constraints.
- Edge: empty tag arrays, nullable optional fields, and incomplete click referrer data are handled without breaking inserts.

### Integration Tests

- Positive: running migrations creates all required tables and constraints successfully.
- Positive: seed data inserts a valid active prompt and a small active offer catalog.
- Negative: inserting a recommendation with a non-existent offer or conversation fails.
- Negative: inserting duplicate offer slugs fails.
- Edge: deleting a conversation cascades to messages and recommendations as expected.
- Edge: click records remain queryable even if the related recommendation is removed, when `recommendation_id` is nullable with `set null` semantics.

### E2E Tests

- Positive: a seeded environment can support a full chat flow that ends with persisted recommendations and click tracking.
- Negative: admin views should not break when no clicks exist yet.
- Edge: the public flow should still function when some offers are inactive and excluded from selection.

## Acceptance Criteria

- [ ] Versioned SQL migration files exist under `supabase/migrations/`.
- [ ] Migration files follow a consistent versioning convention, such as timestamp-prefixed filenames.
- [ ] All required MVP tables from the brief are defined.
- [ ] `offers` includes all minimum required fields from the brief.
- [ ] Primary keys, foreign keys, and essential indexes are defined.
- [ ] Data integrity constraints exist for obvious failure cases such as duplicate slugs and invalid recommendation scores.
- [ ] The schema enforces that only one system prompt can be active at a time.
- [ ] The schema enforces valid `messages.role` values.
- [ ] The schema supports offer soft deactivation through `is_active`.
- [ ] The schema supports one active system prompt for MVP.
- [ ] The `clicks.sub_id` field is indexed for tracking lookup and diagnostics.
- [ ] Seed data exists for a small offer catalog and one active prompt.
- [ ] Migration execution and seed execution are documented or scriptable.
- [ ] Later application code can persist conversations, messages, recommendations, clicks, and analytics events without schema changes.

## Sprint Tasks

1. Define the concrete column set, key strategy, and constraints for each required table.
2. Establish the migration naming/versioning convention for SQL files under `supabase/migrations/`.
3. Create the initial SQL migration file under `supabase/migrations/`.
4. Add indexes for the main MVP query paths, including `clicks.sub_id`.
5. Add constraints for duplicate protection, score/rank validity, single active prompt enforcement, and valid message roles.
6. Create a seed file or seed SQL for 8-12 initial offers and one active system prompt.
7. Validate migration and seed execution against the local or target Supabase environment.
8. Document any assumptions that later specs must respect, especially around tags, prompt activation, and click relationships.
