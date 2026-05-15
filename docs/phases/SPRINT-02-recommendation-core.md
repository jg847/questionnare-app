# Sprint 02: Recommendation Core

## Goal

Build the backend recommendation loop before polishing the public UI.

## Linked Specs

- docs/\_spec/SPEC-03-llm-integration-and-recommendation-engine.md

## Dependencies

- Sprint 01 complete

## Scope

- POST /api/chat
- ChatService
- RecommendationEngine
- OpenAI integration
- Prompt loading from the seeded active prompt row, with local fallback only for development
- Deterministic fallback scoring
- Deterministic minimum-context gating for entering recommendation mode
- Persistence of conversations, messages, and recommendations
- Emission of chat-owned analytics events
- Stable typed service contract for Sprint 03 UI consumption

## Deliverables

- Chat API route
- Typed chat request and response contract
- OpenAI-backed orchestration service
- Prompt-loading path using the seeded active prompt as the default MVP source
- Fallback scoring path
- Deterministic recommendation-mode gating
- Persistence for conversation state and recommendation results
- Analytics event emission for the chat-owned event set
- Stable canonical response contract ready for Sprint 03 consumption

## Tasks

1. Implement the POST /api/chat request and response contract.
2. Build ChatService orchestration over prompt loading and provider execution.
3. Implement prompt loading from the seeded active system prompt row, with a local constant allowed only as a development fallback.
4. Build RecommendationEngine ranking and fallback scoring.
5. Implement the deterministic minimum-context rule for entering recommendation mode.
6. Normalize and validate structured recommendation output.
7. Ensure recommendation results target 3 to 5 items when enough eligible offers exist and never exceed 5.
8. Persist conversations, messages, and recommendations.
9. Set conversations.recommendation_generated when recommendations are produced.
10. Emit conversation_started, message_sent, message_received, and recommendations_generated.
11. Keep the canonical response contract stable enough for Sprint 03 UI integration and testing.
12. Add unit and integration coverage for success, failure, fallback behavior, prompt loading, and minimum-context gating.

## Validation

- A chat request enters recommendation mode only after the deterministic minimum-context rule is satisfied.
- Prompt loading uses the seeded active prompt row by default and only falls back to a local constant in development scenarios.
- A chat request with enough context returns structured recommendations in the canonical contract.
- Recommendation results target 3 to 5 items when enough eligible offers exist and never exceed 5.
- Provider failures fall back cleanly.
- Recommendation results persist correctly.
- The required analytics events are emitted.
- The service contract is stable enough for Sprint 03 to consume without inventing backend behavior.

## Exit Criteria

- The backend recommendation loop works independently of the final UI polish.
- The canonical chat contract and prompt-loading behavior are stable enough for Sprint 03 integration.
- Sprint 03 can consume the API without inventing backend behavior.

## Out of Scope

- Final homepage interaction polish
- Affiliate click tracking
- Admin login or admin UI
