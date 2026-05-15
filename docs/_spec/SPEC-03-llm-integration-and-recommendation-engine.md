# Spec: LLM Integration & Recommendation Engine

**ID:** SPEC-03  
**Status:** Draft  
**Sprint:** 2

## Summary

This spec defines the conversational intelligence layer for ToolMatch AI. It covers how Arlo asks questions, how conversation state is translated into a recommendation request, how ranked recommendations are produced in a structured format, and how the system falls back to deterministic scoring when the LLM response is invalid or unavailable.

## User Stories

- As a user, I want Arlo to ask concise questions so that I can quickly describe my needs.
- As a user, I want recommendations that feel relevant and understandable so that I can decide which tools to evaluate.
- As a developer, I want a typed recommendation contract and fallback logic so that the recommendation flow is reliable even when the LLM is imperfect.

## MVP Scope

### Must Exist for MVP

- A `ChatService` that manages conversation orchestration for the public chat flow
- A `RecommendationEngine` that ranks eligible offers against user needs
- OpenAI integration as the only required LLM provider for MVP
- Structured response parsing for recommendation output
- A deterministic fallback scoring path when LLM calls fail or return malformed data
- Prompt loading from a seeded active prompt row as the default MVP source, with a local constant allowed only as a development fallback
- Token-budget-aware prompt construction
- A typed response contract that the UI can render directly

### Can Be Stubbed or Deferred

- Anthropic integration and multi-provider routing
- Provider decorators for advanced retries, tracing, or observability beyond basic error handling
- Long-term prompt version experimentation workflows
- Semantic retrieval or RAG-style augmentation
- Personalization beyond current-session questionnaire responses

### Assumptions

- The initial catalog is small enough that all active offers can be loaded and ranked in memory.
- The MVP recommendation loop does not need external vendor enrichment or retrieval.
- OpenAI is available through the configured API key and Vercel AI SDK integration.
- The canonical prompt source for MVP is the seeded active prompt row in `system_prompts`.
- A local constant may be used only as a development fallback when database prompt loading is unavailable.

## Functional Requirements

1. Implement a `ChatService` responsible for coordinating the question flow, LLM interaction, and recommendation completion state.
2. Implement a `RecommendationEngine` responsible for ranking offers using the product criteria defined in the brief.
3. Use OpenAI as the only required provider for MVP.
4. Define one canonical typed recommendation response shape that includes conversational reply content and structured recommendation items.
5. The canonical recommendation item contract must include at minimum `offer_id`, `match_score`, `match_reason`, and rank position.
6. The system prompt must instruct Arlo to act as a friendly software advisor, ask 4 to 6 conversational questions, detect when enough context exists, and return structured recommendations.
7. The conversation flow must gather enough information to support recommendation criteria, including use case, team size, budget, and key priorities.
8. “Enough context” must be determined by a deterministic orchestration rule before recommendation mode is entered: the system must have a use case plus at least two of the following: team size, budget, or priorities.
9. The LLM output must be parsed, normalized into the canonical contract, and validated before it is accepted for rendering or persistence.
10. If the LLM response is malformed, incomplete, references invalid offers, or the provider call fails, the system must fall back to deterministic rule-based scoring.
11. The fallback scoring logic must use the same dimensions defined in the brief: category fit, team-size fit, budget fit, priority fit, and offer eligibility.
12. Inactive offers must never be returned in either LLM-backed or fallback recommendations.
13. The recommendation flow should aim to return 3 to 5 ranked recommendations when enough eligible offers exist and must never exceed 5 recommendations.
14. Prompt construction must stay concise enough to avoid unnecessary token usage while still providing the LLM with catalog context and output instructions.
15. The service layer must support persisting conversation messages and final recommendation results through the data model defined in SPEC-02.
16. The chat orchestration layer must emit the MVP analytics events it owns into the `analytics_events` store from SPEC-02: `conversation_started` when a new conversation begins, `message_sent` for each user turn sent to the service, `message_received` for each assistant reply returned to the user, and `recommendations_generated` when final recommendations are produced.
17. When recommendations are produced, the service layer must also persist `conversations.recommendation_generated = true` for that conversation so the lightweight MVP analytics foundation can inspect recommendation generation without waiting for SPEC-09.
18. The response format exposed to later API/UI layers must be stable enough for unit and integration testing.

## Non-Functional Requirements

- Keep the implementation simple enough for a 2-week MVP.
- Favor deterministic behavior and explicit validation over clever prompting.
- Ensure failures degrade gracefully into fallback recommendations rather than blank responses.
- Keep provider-specific code isolated from business logic.
- Avoid coupling UI rendering concerns to provider response formats.

## Data Model

This spec depends on the schema defined in [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md).

Tables used directly by this spec:

- `offers` for the active recommendation catalog
- `system_prompts` for active prompt content when database-backed prompt loading is enabled
- `conversations` for chat session persistence
- `messages` for user and assistant messages
- `recommendations` for final ranked recommendations

No new tables are required for MVP.

## API Contract

This spec defines the service contract that the chat API route will rely on.

Required route contract:

- `POST /api/chat`

Suggested route request shape:

```ts
type ChatApiRequest = {
  session_id: string;
  message: string;
};
```

Suggested route response shape:

- the route returns the canonical `ChatServiceResult` shape defined below

Canonical service-level response shape:

```ts
type ChatServiceResult = {
  reply: string;
  needsMoreInfo: boolean;
  collectedContext: {
    useCase?: string;
    teamSize?: string;
    budget?: string;
    priorities?: string[];
  };
  recommendations?: Array<{
    offer_id: string;
    rank: number;
    match_score: number;
    match_reason: string;
  }>;
  completionReason?:
    | 'needs_more_info'
    | 'llm_recommendation'
    | 'fallback_recommendation';
};
```

Suggested internal provider output contract:

```ts
type RecommendationOutput = {
  needsMoreInfo: boolean;
  reply: string;
  recommendations?: Array<{
    offer_id: string;
    match_score: number;
    match_reason: string;
  }>;
};
```

Validation requirements:

- provider output must be normalized into the canonical service contract before persistence or UI use
- recommendation IDs must correspond to active offers
- `match_score` must be numeric and within 0 to 100
- recommendation count must not exceed 5
- duplicate offers must be rejected
- the route request contract must accept the browser `session_id` from SPEC-04 so chat persistence and click tracking share the same session identity

## UI/UX Notes

- Arlo should sound concise, practical, and friendly rather than overly verbose.
- The user should not see raw JSON or parsing artifacts.
- If fallback recommendations are used, the user-facing experience should still feel coherent and uninterrupted.
- Follow-up questions should not feel repetitive once the core context is known.
- The switch into recommendation mode should feel consistent because it is driven by a deterministic minimum-context rule.

## Design Patterns

- **Strategy:** separate the rule-based scoring strategy from the LLM-backed recommendation path.
- **Factory:** if a provider abstraction is retained for MVP, provider construction should be isolated behind a simple factory.
- **Builder:** prompt generation should be composed from reusable sections, such as persona, context summary, offer summary, and output instructions.
- **Dependency Inversion:** `ChatService` should depend on provider and repository abstractions rather than direct SDK usage in every method.
- **Single Responsibility:** `ChatService` orchestrates, `RecommendationEngine` ranks, and parser/validator utilities enforce structured output.

## Test Cases

### Unit Tests

- Positive: valid structured provider output is parsed and normalized into the canonical service response successfully.
- Positive: fallback scoring returns ranked active offers using user context and catalog tags.
- Negative: malformed JSON or invalid provider output triggers the fallback path.
- Negative: inactive or unknown offer IDs returned by the provider are rejected.
- Edge: the orchestration layer does not enter recommendation mode until use case plus two additional context dimensions are present.
- Edge: sparse user context still results in a follow-up question rather than premature recommendations.
- Edge: fewer than 5 eligible offers still returns a valid ordered result set.

### Integration Tests

- Positive: a chat request with enough context produces persisted recommendations linked to a conversation.
- Positive: prompt loading succeeds from the active seeded prompt row.
- Positive: `POST /api/chat` accepts `session_id` and `message` and returns the canonical service contract.
- Positive: a new conversation emits `conversation_started`, user turns emit `message_sent`, assistant replies emit `message_received`, and completed recommendation flows emit `recommendations_generated`.
- Negative: provider failure still yields a valid fallback recommendation response.
- Negative: an empty active catalog returns a safe no-results or clarification response rather than crashing.
- Edge: a conversation that reaches recommendation mode after several turns preserves prior context correctly.

### E2E Tests

- Positive: a user can answer Arlo’s questions and receive inline recommendations.
- Negative: if the provider is unavailable, the user still receives usable recommendations through fallback logic.
- Edge: recommendation cards render correctly when only a small subset of active offers matches the user’s needs.

## Acceptance Criteria

- [ ] `ChatService` is defined with clear orchestration responsibility.
- [ ] `RecommendationEngine` is defined with explicit ranking responsibility.
- [ ] OpenAI is the only required provider path for MVP.
- [ ] The system prompt requirements from the brief are reflected in the implementation contract.
- [ ] The seeded active prompt row is the default prompt source for MVP.
- [ ] A typed recommendation response contract exists and is documented.
- [ ] The canonical response contract uses `offer_id`, `match_score`, and `match_reason` naming.
- [ ] Provider output is normalized into the canonical response contract before use.
- [ ] Recommendation mode is gated by a deterministic minimum-context rule.
- [ ] LLM output is validated before acceptance.
- [ ] Invalid or failed LLM responses trigger deterministic fallback scoring.
- [ ] Fallback scoring uses the recommendation criteria defined in the brief.
- [ ] Inactive offers are excluded from all recommendation outputs.
- [ ] Recommendation results target 3 to 5 items when enough eligible offers exist and are capped at 5 items.
- [ ] The service contract is compatible with conversation and recommendation persistence from SPEC-02.
- [ ] `POST /api/chat` is defined with a `session_id` and `message` request contract.
- [ ] The chat orchestration layer emits `conversation_started`, `message_sent`, `message_received`, and `recommendations_generated` into the MVP analytics foundation.
- [ ] Recommendation completion sets `conversations.recommendation_generated = true` for downstream analytics compatibility.
- [ ] Unit and integration tests cover the happy path, malformed output, and fallback behavior.

## Sprint Tasks

1. Define the typed input and output contracts for chat orchestration and recommendation results.
2. Define the canonical field naming contract and normalization step between provider output and service output.
3. Define how conversation context is accumulated across turns and implement the deterministic minimum-context rule for entering recommendation mode.
4. Implement prompt-building utilities using the Arlo persona and output instructions from the brief.
5. Implement prompt loading from the seeded active prompt row, with a local constant only as a development fallback.
6. Implement the OpenAI-backed provider or service integration for MVP.
7. Implement structured output parsing, normalization, and validation.
8. Implement the rule-based fallback ranking strategy using category, team size, budget, priorities, and `is_active` filtering.
9. Implement `POST /api/chat` using the documented `session_id` and `message` request contract.
10. Implement `ChatService` orchestration over prompt loading, provider execution, validation, minimum-context gating, fallback selection, and analytics event emission.
11. Verify compatibility with persistence of conversations, messages, recommendations, and the `recommendation_generated` conversation flag.
12. Add unit and integration tests for success, malformed provider output, provider failure, minimum-context gating, and analytics event emission scenarios.
