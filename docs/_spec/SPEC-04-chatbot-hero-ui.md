# Spec: Chatbot Hero UI

**ID:** SPEC-04  
**Status:** Draft  
**Sprint:** 3

## Summary

This spec defines the public-facing homepage experience for ToolMatch AI. It covers the hero chat interface where users interact with Arlo, the message presentation model, the inline recommendation card UI, client-side session persistence, and the accessibility and responsive behavior required for the MVP chat flow.

## User Stories

- As a user, I want to start chatting immediately from the homepage so that I can get recommendations without navigating through a complex flow.
- As a user, I want Arlo’s responses, follow-up questions, and recommendations to appear clearly in one place so that the process feels conversational and easy to follow.
- As a user, I want the chat experience to work on mobile and keyboard navigation so that I can use it comfortably across devices.

## MVP Scope

### Must Exist for MVP

- A high-emphasis homepage hero centered on the chat experience
- A message-based chat UI for user and assistant turns
- A streaming-capable assistant response UI, with a clear loading-state fallback only if transport constraints prevent true streaming in a given environment
- A visible typing/loading state while Arlo is responding
- Quick-reply chips for common answer shortcuts
- Automatic scroll management as new messages arrive
- Inline recommendation cards rendered inside the chat flow
- A lightweight non-blocking save-results prompt shown after recommendations render
- Browser session ID generation and persistence for the current browser session
- Mobile-responsive and accessible interaction patterns
- Affiliate disclosure near recommendation CTAs

### Can Be Stubbed or Deferred

- Rich animations beyond simple loading and reveal behavior
- Advanced message editing, retrying, or transcript export
- Personalized UI themes or user preferences
- Multi-page onboarding or comparison workflows outside the hero chat
- Full email workflow integration beyond a prompt-level save-results surface

### Assumptions

- The homepage is the primary entry point and should prioritize the chat over secondary content.
- Recommendation cards will render from the canonical response contract defined in [docs/\_spec/SPEC-03-llm-integration-and-recommendation-engine.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-03-llm-integration-and-recommendation-engine.md).
- Session persistence only needs to survive a browser session for MVP.
- The chat transcript can be client-managed for the UI layer while persistence is handled through the chat API.

## Functional Requirements

1. Implement the public homepage as a hero-first interface where the chatbot is the main interaction surface.
2. Render user and assistant messages as distinct chat bubbles, with user messages visually aligned to the right and assistant messages aligned to the left.
3. Show assistant responses through a streaming-capable UI path, with a loading-state fallback only when streaming is not available in the active transport path.
4. Display a typing or loading indicator while waiting for assistant output.
5. Provide quick-reply chips for common user inputs, such as team size or common working modes.
6. Automatically and smoothly scroll the transcript to keep the newest content in view as new messages and recommendations appear.
7. Render recommendation cards inline in the chat once recommendation mode completes.
8. Each recommendation card must display at minimum the tool name, logo when available, one-line description, match score, match reason, and a CTA for visiting the vendor site.
9. Recommendation cards must support tracked outbound clicks and display affiliate disclosure text immediately adjacent to the CTA area or within the same card action row.
10. After recommendations render, show a lightweight non-blocking save-results prompt for email capture, without requiring validation, persistence, or a multi-step email workflow in MVP.
11. Generate a browser session identifier client-side and persist it for the browser session.
12. Reuse the persisted browser session identifier for subsequent chat requests and tracked recommendation clicks during the same session.
13. Ensure the chat UI works across mobile and desktop breakpoints.
14. Ensure all core chat interactions are keyboard accessible.
15. Provide accessible labeling and screen-reader-friendly semantics for message input, send action, quick replies, and recommendation actions.
16. Use appropriate ARIA labeling and live-region behavior so streaming responses, typing state, and newly rendered recommendations are announced meaningfully to assistive technologies.
17. The UI must handle fallback-generated recommendations without exposing underlying provider or parsing details.
18. The UI must gracefully handle empty, loading, and error states without breaking the chat transcript.

## Non-Functional Requirements

- The homepage should load quickly and prioritize the main chat interface over decorative complexity.
- The interaction model should remain understandable on small screens.
- Accessibility must be treated as a built-in requirement, not a later enhancement.
- The chat transcript should feel stable while content is appended, without jarring layout shifts.
- The UI should remain implementation-simple enough for Sprint 2.

## Data Model

This spec depends on the persistence and response contracts defined in:

- [docs/\_spec/SPEC-02-database-schema-and-migrations.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-02-database-schema-and-migrations.md)
- [docs/\_spec/SPEC-03-llm-integration-and-recommendation-engine.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/docs/_spec/SPEC-03-llm-integration-and-recommendation-engine.md)

Data consumed by this UI includes:

- chat messages for transcript rendering
- recommendation objects containing `offer_id`, `rank`, `match_score`, and `match_reason`
- offer metadata such as name, description, logo, and CTA target
- client-side browser session identifier

No new database tables are required for this spec.

## API Contract

This UI depends on `POST /api/chat`, which returns:

- assistant reply content
- `needsMoreInfo`
- collected or inferred context state as needed by the client
- structured recommendations when available
- enough metadata to distinguish normal recommendation completion from fallback completion if needed internally

The chat API request contract must accept the client-generated browser `session_id` so the same session can be reused across turns.

The UI also depends on a tracking API used by recommendation CTAs before navigation.

Suggested UI-facing request shape:

```ts
type ChatRequest = {
  session_id: string;
  message: string;
};
```

Suggested UI-facing message shape:

```ts
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};
```

Suggested UI-facing recommendation shape:

```ts
type ChatRecommendation = {
  offer_id: string;
  rank: number;
  match_score: number;
  match_reason: string;
  name: string;
  description: string;
  logo_url?: string;
  affiliate_url: string;
};
```

## UI/UX Notes

- The hero should feel like a focused product tool, not a marketing splash page with a chat widget tacked on.
- The layout should read as a full-screen or clearly high-emphasis hero experience.
- User messages should appear on the right and assistant messages on the left.
- Recommendation cards should feel like a natural continuation of the conversation rather than a separate results page.
- Recommendation cards should show the tool logo when available, without collapsing layout when a logo is missing.
- Recommendation CTAs should read clearly as a “Visit Site” action or equivalent direct outbound action.
- Affiliate disclosure should be placed in the same visible action cluster as the outbound CTA, not separated from the CTA by unrelated content.
- Quick replies should accelerate common answers but never trap the user into predefined choices only.
- The save-results prompt should appear after recommendation cards, without blocking access to the results or introducing a full email workflow.
- Empty and error states should preserve trust by being calm and explicit rather than technical.

## Design Patterns

- **Single Responsibility:** chat transcript rendering, message input, recommendation card rendering, and session management should be separated into focused UI components or hooks.
- **Observer:** the UI should react to message and recommendation state changes without tightly coupling every component to the transport implementation.
- **Builder:** recommendation card content can be composed from the canonical recommendation object and offer metadata.
- **Dependency Inversion:** UI components should depend on typed chat contracts and UI hooks rather than direct fetch logic embedded everywhere.

## Test Cases

### Unit Tests

- Positive: user and assistant messages render as distinct bubbles with the correct alignment and visual treatment.
- Positive: recommendation cards render the required fields from the canonical recommendation data.
- Negative: missing optional fields such as `logo_url` do not break card rendering.
- Negative: loading and error states render without removing prior transcript context.
- Edge: streamed assistant content appends cleanly without duplicating or reordering transcript entries.
- Edge: live-region announcements do not spam repeated or duplicate content during streaming updates.
- Edge: long match reasons wrap correctly without breaking the layout.
- Edge: quick replies remain usable on narrow screens.

### Integration Tests

- Positive: sending a chat message appends the user message and then renders the assistant response.
- Positive: a recommendation response renders inline cards in rank order.
- Positive: the browser session ID is created once and reused across subsequent chat interactions.
- Positive: the client includes the persisted `session_id` in subsequent chat requests.
- Positive: the UI sends requests to `POST /api/chat` using the documented request contract from SPEC-03.
- Negative: an API error renders a safe error state while preserving prior messages.
- Edge: fallback recommendation responses render the same card UI without exposing internal source differences.

### E2E Tests

- Positive: a user lands on the homepage, chats with Arlo, and sees recommendation cards inline.
- Positive: quick replies can be used to accelerate the conversation.
- Negative: the UI remains usable when a chat request fails temporarily.
- Edge: the full chat flow works on a mobile viewport.
- Edge: keyboard-only navigation can send a message and activate a recommendation CTA.
- Edge: screen-reader-relevant states such as typing and newly available recommendations are announced without breaking usability.

## Acceptance Criteria

- [ ] The homepage presents the chatbot as the main hero interaction.
- [ ] The homepage presents the chatbot as a full-screen or clearly high-emphasis hero interaction.
- [ ] User and assistant messages render as distinct chat bubbles with left/right alignment.
- [ ] The UI supports streamed assistant responses, with a defined loading-state fallback if streaming is unavailable.
- [ ] The UI exposes a clear loading or typing state while the assistant is responding.
- [ ] Quick-reply chips are available for common answers.
- [ ] New messages and recommendations scroll into view reliably with smooth transcript behavior.
- [ ] Recommendation cards render inline in the chat transcript.
- [ ] Recommendation cards display tool name, logo when available, description, match score, match reason, and CTA.
- [ ] Affiliate disclosure appears immediately adjacent to recommendation CTA actions or within the same action row.
- [ ] A lightweight non-blocking save-results prompt appears after recommendations render.
- [ ] A browser session ID is generated and reused for the current browser session.
- [ ] The persisted browser `session_id` is included in subsequent chat requests.
- [ ] The UI is responsive on mobile and desktop.
- [ ] Core interactions are keyboard accessible and labeled for assistive technologies.
- [ ] ARIA labeling and live-region behavior support typing state, streamed updates, and newly rendered recommendations.
- [ ] Error, loading, and fallback-result states render without breaking the transcript.

## Sprint Tasks

1. Define the page layout and component breakdown for the public homepage chat experience.
2. Implement the core transcript UI with distinct left/right message bubble presentation.
3. Implement message input, send behavior, streamed assistant rendering, and assistant loading fallback state.
4. Add quick-reply chip interactions for common response shortcuts.
5. Implement client-side browser session ID generation and session reuse.
6. Implement inline recommendation card rendering from the canonical recommendation contract, including logo handling.
7. Add affiliate disclosure and integrate the recommendation CTA surface with the future tracking flow.
8. Add the post-recommendation email capture prompt.
9. Validate responsive layout, keyboard access, ARIA labeling, and live-region behavior for streamed chat updates.
10. Add unit, integration, and E2E coverage for the critical chat and recommendation rendering path.
