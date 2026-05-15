# Sprint 06: Post-MVP Enhancements

## Goal

Expand the product only after the launch-critical MVP is working and validated.

## Linked Specs

- docs/\_spec/SPEC-08-admin-system-prompt-editor.md
- docs/\_spec/SPEC-09-analytics-dashboard.md
- docs/\_spec/SPEC-10-source-code-export-cli.md

## Dependencies

- Sprints 01 through 05 complete
- Launch-critical flow verified in a deployable state

## Scope

- Prompt management UI
- Active-prompt view, version history, creation, activation, revert, and sandbox isolation
- Expanded analytics dashboard
- Deterministic analytics formulas, protected analytics routes, and low-volume safe states
- Source export tooling
- Required CLI invocation methods, deterministic export ordering, and explicit include/exclude rules

## Deliverables

- Admin prompt editor
- Active prompt view, version history, sandbox flow, and revert behavior
- Richer analytics dashboard
- Deterministic summary, funnel, offer, and last-30-days activity reporting
- Source export CLI
- `scripts/export-source.ts` plus `npm run export` support with deterministic export output

## Tasks

1. Implement the prompt editor and sandbox workflows from SPEC-08.
2. Implement active-prompt viewing, version history, prompt creation without overwrite, activation, revert, and single-active-prompt enforcement.
3. Verify sandbox execution is isolated from the production active prompt and remains compatible with the SPEC-03 recommendation contract.
4. Verify prompt-management pages and APIs remain protected by admin auth.
5. Implement the post-MVP analytics dashboard from SPEC-09.
6. Define and implement deterministic formulas for total conversations, recommendation generation rate, funnel stages, and CTR per offer.
7. Implement the minimum expanded metric set: total conversations, recommendation generation rate, total clicks, top clicked offer, top 5 offers by clicks, CTR per offer, funnel view, and last 30 days activity.
8. Preserve the separation between the lightweight MVP analytics foundation and this later dashboard expansion.
9. Add safe empty-state handling and verify auth protection for analytics pages and APIs.
10. Implement the source export CLI from SPEC-10.
11. Add `scripts/export-source.ts`, `npm run export`, deterministic traversal and ordering, explicit file-boundary formatting, and deterministic total-line reporting.
12. Enforce the required include/exclude rules, including exclusion of lockfiles, generated directories, dependency directories, and the generated `exports/` directory itself.
13. Validate both required export invocation methods and confirm the tool does not affect runtime behavior.
14. Validate that enhancements do not regress the launch-critical flow.

## Validation

- Prompt management works without breaking the MVP prompt source.
- Active prompt viewing, version history, activation, revert, and sandbox behavior work without violating the single-active-prompt rule.
- Sandbox execution remains isolated from production prompt state and protected by admin auth.
- Expanded analytics build on the existing MVP analytics foundation.
- Analytics formulas for total conversations, recommendation generation rate, funnel stages, and CTR are deterministic and documented.
- The analytics dashboard exposes the required post-MVP metric set and handles low-volume or empty states safely.
- Analytics routes and APIs remain protected by admin auth.
- Source export tooling works without affecting runtime behavior.
- The export CLI runs through both required invocation methods, excludes generated/dependency paths including `exports/`, preserves deterministic ordering, and reports total files, total lines, and output path.

## Exit Criteria

- Post-MVP enhancements are additive and do not weaken the launch-critical product.
- SPEC-08, SPEC-09, and SPEC-10 are implemented with their core operational contracts, without reopening MVP scope or launch-critical requirements.

## Out of Scope

- Reopening MVP scope decisions that were intentionally deferred
