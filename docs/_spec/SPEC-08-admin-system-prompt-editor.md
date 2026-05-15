# Spec: Admin System Prompt Editor

**ID:** SPEC-08  
**Status:** Draft  
**Sprint:** 6

## Summary

This spec defines the post-MVP admin interface for viewing, creating, testing, activating, and reverting recommendation system prompts in ToolMatch AI. It covers active prompt visibility, prompt version history, saving new versions, a lightweight sandbox for testing draft prompts, and reverting to prior versions while preserving a single active prompt at any given time.

## User Stories

- As an admin, I want to view the active system prompt so that I know what guidance Arlo is currently using.
- As an admin, I want to save a new prompt version without overwriting history so that I can iterate safely.
- As an admin, I want to test a draft prompt in a sandbox before activating it so that I can reduce risk to the live recommendation flow.

## MVP Scope

### Must Exist for This Spec

- A protected admin view showing the currently active prompt
- A way to save a new prompt version into `system_prompts`
- A version history view for prior prompts
- A lightweight sandbox for testing a draft prompt without making it active
- A revert flow that activates a prior prompt version
- Enforcement of a single active prompt at a time in coordination with SPEC-02

### Can Be Stubbed or Deferred

- Rich prompt diff tooling
- Multi-user collaboration on prompt drafts
- Branching draft workflows or approval queues
- Prompt performance experiments or A/B routing
- Automated prompt scoring beyond simple sandbox inspection
- Prompt export or import tooling

### Assumptions

- This feature is post-MVP and should not block the simple two-week build.
- Prompt records use the `system_prompts` schema defined in [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).
- Protected admin access is provided by [docs/\_spec/SPEC-06-admin-authentication.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-06-admin-authentication.md).
- The live recommendation flow described in [docs/\_spec/SPEC-03-llm-integration-and-recommendation-engine.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-03-llm-integration-and-recommendation-engine.md) reads from the single active prompt.
- Saving a new version does not automatically require activation unless the admin explicitly chooses that action.

## Functional Requirements

1. Implement a protected admin view for the active system prompt.
2. Display the active prompt version, content, and creation timestamp.
3. Provide a form for creating and saving a new prompt version.
4. Saving a new prompt version must create a new `system_prompts` row rather than overwriting historical content.
5. Provide a version history list showing prior prompt versions in reverse chronological or reverse version order.
6. The version history view must allow an admin to inspect prior prompt content.
7. Provide a sandbox where an admin can test a draft prompt against representative input without activating it.
8. Sandbox execution must not change the active prompt unless the admin explicitly activates a version.
9. Provide an activation flow for a selected prompt version.
10. Provide a revert flow that makes a prior prompt version active again.
11. Activation and revert flows must preserve the schema-level guarantee from SPEC-02 that only one prompt is active at a time.
12. The prompt editor must not require direct database access for normal admin use.
13. Protected prompt-management routes and APIs must require authenticated admin access from SPEC-06.
14. Invalid prompt submissions must be rejected with clear validation feedback.
15. The sandbox must be clearly separated from the live production recommendation path.
16. The feature must remain compatible with the active-prompt loading behavior defined in SPEC-03.

## Non-Functional Requirements

- Keep this feature explicitly outside the launch-critical MVP path.
- Preserve prompt history rather than allowing destructive overwrite behavior.
- Keep sandbox behavior deterministic enough for useful admin review.
- Avoid allowing draft testing to silently affect production prompt state.
- Keep the admin workflows understandable without introducing complex experiment infrastructure.

## Data Model

This spec depends on the `system_prompts` table from [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).

Relevant fields:

- `id`
- `version`
- `content`
- `is_active`
- `created_at`

No new tables are strictly required for the initial version of this spec.

If sandbox history or draft-specific metadata becomes important later, that should be handled as a follow-on enhancement rather than expanding this first version unnecessarily.

## API Contract

Suggested protected admin endpoints:

- `GET /api/admin/prompts`
- `GET /api/admin/prompts/:id`
- `POST /api/admin/prompts`
- `POST /api/admin/prompts/:id/activate`
- `POST /api/admin/prompts/:id/revert`
- `POST /api/admin/prompts/sandbox`

Suggested request shape for creating a prompt version:

```ts
type AdminPromptCreateInput = {
  content: string;
  activate?: boolean;
};
```

Suggested response shape for prompt history rows:

```ts
type AdminPromptListItem = {
  id: string;
  version: number;
  is_active: boolean;
  created_at: string;
};
```

Suggested response shape for prompt detail:

```ts
type AdminPromptDetail = {
  id: string;
  version: number;
  content: string;
  is_active: boolean;
  created_at: string;
};
```

Suggested request shape for sandbox testing:

```ts
type AdminPromptSandboxRequest = {
  content: string;
  sampleConversation: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  sampleContext?: {
    useCase?: string;
    teamSize?: string;
    budget?: string;
    priorities?: string[];
  };
};
```

Suggested response shape for sandbox testing:

```ts
type AdminPromptSandboxResponse = {
  reply: string;
  needsMoreInfo: boolean;
  recommendations?: Array<{
    offer_id: string;
    rank?: number;
    match_score: number;
    match_reason: string;
  }>;
};
```

Behavior requirements:

- creating a prompt version inserts a new row and may optionally activate it
- activation sets the selected prompt active while ensuring all others are inactive
- revert explicitly re-activates a prior version without deleting newer prompt rows
- sandbox requests use draft prompt content plus representative conversation/context input without modifying production prompt state
- sandbox responses should be shaped closely enough to the SPEC-03 recommendation contract to make admin review meaningful
- protected endpoints must deny unauthenticated access per SPEC-06

## UI/UX Notes

- The active prompt should be clearly distinguishable from historical versions.
- Version history should make it obvious which prompt is active and which are inactive.
- Creating a new prompt version should feel safe and reversible.
- Sandbox controls should make it clear that the admin is testing a draft, not changing production behavior.
- Sandbox inputs should support representative multi-turn prompt testing rather than only a single freeform string.
- Revert actions should be deliberate and clearly labeled.

## Design Patterns

- **Repository:** prompt reads, version creation, and activation writes should be encapsulated behind a prompt repository or data access layer.
- **Single Responsibility:** prompt editing, version listing, sandbox execution, and activation logic should remain separate concerns.
- **Observer:** prompt activation can later emit analytics or operational events without tightly coupling the editor UI to those systems.
- **Dependency Inversion:** the admin prompt UI should depend on typed prompt contracts and sandbox services rather than direct provider calls from components.

## Test Cases

### Unit Tests

- Positive: creating a new prompt version produces the correct insert payload.
- Positive: activating a selected version marks only that prompt as active.
- Positive: reverting a selected prior version re-activates it without deleting newer versions.
- Negative: empty or invalid prompt content is rejected.
- Edge: reverting to an older version reactivates that version without destroying newer history.
- Edge: sandbox execution uses the provided draft content and representative conversation/context input without mutating stored active prompt state.

### Integration Tests

- Positive: an authenticated admin can fetch the active prompt and version history.
- Positive: an authenticated admin can save a new prompt version.
- Positive: an authenticated admin can activate or revert to a prior prompt version while preserving a single active prompt.
- Positive: sandbox execution returns a recommendation-like test result without changing the active prompt.
- Negative: unauthenticated requests to prompt-management routes or APIs are denied.
- Negative: invalid prompt submissions are rejected with safe validation behavior.

### E2E Tests

- Positive: an authenticated admin can view the active prompt and version history.
- Positive: an authenticated admin can create a new prompt version and later activate it.
- Positive: an authenticated admin can test a draft prompt in the sandbox with representative multi-turn input without changing production state.
- Positive: an authenticated admin can revert to a prior version.
- Negative: an unauthenticated user cannot access the prompt editor.

## Acceptance Criteria

- [ ] A protected admin view for the active prompt exists.
- [ ] Admins can save a new prompt version without overwriting history.
- [ ] Version history exists and prior prompt content can be inspected.
- [ ] Sandbox testing exists for draft prompts.
- [ ] Sandbox testing does not change the active prompt unless explicit activation occurs.
- [ ] Sandbox testing accepts representative multi-turn conversation input and returns a response aligned closely enough with the SPEC-03 recommendation contract for admin review.
- [ ] Admins can activate a selected prompt version.
- [ ] Admins can revert to a prior prompt version.
- [ ] Only one prompt version is active at a time, consistent with SPEC-02.
- [ ] Prompt-management routes and APIs are protected by the admin auth flow from SPEC-06.
- [ ] The feature remains compatible with active prompt loading from SPEC-03.
- [ ] Unit, integration, and E2E tests cover history, sandbox, activation, revert, and auth behavior.

## Sprint Tasks

1. Define protected prompt-management routes and API contracts.
2. Implement the active-prompt view and version history list.
3. Implement creation of new prompt versions without destructive overwrite.
4. Implement prompt detail reads for viewing historical content.
5. Implement activation and explicit revert flows while preserving a single active prompt.
6. Implement a lightweight sandbox path for testing draft prompt content against representative conversation/context input.
7. Verify sandbox isolation from the production active prompt state.
8. Verify sandbox output is close enough to the SPEC-03 recommendation contract for meaningful admin review.
9. Verify auth protection for all prompt-management pages and APIs.
10. Add unit, integration, and E2E coverage for history, create, sandbox, activation, revert, and auth behavior.
