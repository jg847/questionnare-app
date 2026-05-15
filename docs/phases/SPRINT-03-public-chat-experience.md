# Sprint 03: Public Chat Experience

## Goal

Connect the recommendation core to a usable public homepage experience.

## Linked Specs

- docs/\_spec/SPEC-04-chatbot-hero-ui.md

## Dependencies

- Sprint 02 complete

## Scope

- Hero chat page
- Transcript rendering
- Distinct left/right user and assistant message presentation
- Streaming-capable response UI
- Typing and loading-state behavior
- Smooth auto-scroll behavior
- Loading and error handling
- Quick replies
- Inline recommendation cards
- Session ID persistence
- Mobile-responsive layout validation
- Keyboard and screen-reader accessibility
- Affiliate disclosure
- Non-blocking save-results prompt
- Fallback-result rendering parity

## Deliverables

- Homepage chat hero
- Transcript and message input UI
- Recommendation cards rendered inline with required fields
- Reused browser session ID across turns
- Recommendation CTA layer prepared to pass the reused browser session ID into Sprint 04 tracking flows
- Accessible loading, error, keyboard, labeling, and live-region behavior
- Mobile-ready chat experience across required breakpoints

## Tasks

1. Build the hero-first homepage layout.
2. Implement transcript rendering and message input with distinct left/right user and assistant bubble presentation.
3. Connect the UI to POST /api/chat.
4. Add loading-state, typing-state, streaming-capable response behavior, and smooth auto-scroll behavior.
5. Add quick replies for common answers.
6. Persist and reuse the browser session ID.
7. Ensure the reused browser session ID is available to recommendation CTA interactions so Sprint 04 tracking can consume the same session contract without UI redesign.
8. Render recommendation cards from the canonical contract, including tool name, logo when available, description, match score, match reason, and CTA.
9. Ensure fallback-generated recommendations render through the same UI path without exposing provider or parsing details.
10. Add affiliate disclosure and the save-results prompt.
11. Validate mobile responsiveness, keyboard access, accessible labeling, and live-region behavior.
12. Add unit, integration, and E2E coverage for the public chat flow.

## Validation

- A user can complete the core chat flow from the homepage.
- User and assistant messages render with the required left/right chat presentation.
- Recommendations render inline with the required fields and safe logo handling.
- Browser session ID is reused across turns.
- Recommendation CTA interactions are wired to the same browser session ID contract that Sprint 04 tracking will consume.
- Typing, loading, and auto-scroll behavior work without breaking transcript stability.
- Error and loading states preserve transcript integrity.
- Fallback-generated recommendations render without exposing backend implementation details.
- The UI works across required mobile and desktop breakpoints.
- Core interactions are keyboard accessible and screen-reader-friendly.

## Exit Criteria

- The public-facing recommendation flow works end-to-end up to outbound CTA clicks.
- The homepage UI contract from SPEC-04 is implemented strongly enough that Sprint 04 only adds tracking behavior, not chat UI redesign.
- Sprint 04 can add monetization and access control without reworking the chat flow.

## Out of Scope

- Click tracking implementation
- Admin authentication
- Offer catalog management
