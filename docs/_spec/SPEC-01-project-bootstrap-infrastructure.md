# Spec: Project Bootstrap & Infrastructure

**ID:** SPEC-01  
**Status:** Draft  
**Sprint:** 1

## Summary

This spec establishes the base application and delivery infrastructure for ToolMatch AI. It defines the initial Next.js application scaffold, development tooling, environment configuration, test harnesses, and deployment wiring required so later feature work can be implemented on a stable, consistent foundation.

## User Stories

- As a developer, I want a working Next.js and TypeScript foundation so that feature work can start without repo setup friction.
- As a developer, I want consistent linting, formatting, and testing tools so that changes are easier to validate and maintain.
- As a project owner, I want a simple deployable baseline so that the app can be previewed early and improved incrementally.

## MVP Scope

### Must Exist for MVP

- Next.js 14+ app using App Router and TypeScript
- Tailwind CSS configured and working
- shadcn/ui base setup installed and usable for future UI work
- Minimum required folder structure created for app, components, lib, hooks, types, docs/\_spec, supabase, tests, and .github/workflows
- ESLint, Prettier, and strict TypeScript configuration
- Supabase environment wiring and base database access utilities created
- `.env.example` documenting required variables
- Jest configured for unit tests
- Playwright configured for minimal end-to-end coverage
- `ci.yml` and `deploy.yml` workflow files created with required baseline steps
- Local development and production build commands verified

### Can Be Stubbed or Deferred

- Full shadcn/ui component library adoption beyond the initial base setup
- Advanced GitHub Actions caching and parallelization
- Full preview environment automation beyond a basic Vercel deploy path
- Complex local Supabase orchestration if direct cloud wiring is simpler for MVP

### Assumptions

- The project will use npm unless package-manager constraints appear later.
- Vercel is the deployment target.
- Supabase credentials will be provided before database-backed features are implemented.
- One working CI workflow is more important than an optimized CI workflow.

## Functional Requirements

1. Create a Next.js application using the App Router with TypeScript enabled.
2. Establish the minimum repository structure defined in the project brief, including `app`, `components`, `lib`, `hooks`, `types`, `docs/_spec`, `supabase`, `tests`, and `.github/workflows`.
3. Configure Tailwind CSS so styling utilities work in application routes and components.
4. Install and initialize shadcn/ui at a base level so shared UI components can be added without redoing project setup later.
5. Configure ESLint and Prettier so code style and linting can run locally and in CI.
6. Configure TypeScript in strict mode.
7. Add an `.env.example` file documenting all required environment variables for local setup.
8. Add base Supabase database access wiring, including environment-aware client utilities for server-side use.
9. Add Jest configuration for unit testing TypeScript application code.
10. Add Playwright configuration for minimal browser-based testing against a local app instance.
11. Add a CI workflow that installs dependencies, runs `tsc --noEmit`, runs lint, and runs unit tests.
12. Add a deploy workflow that runs on push to `main` and deploys to Vercel using repository secrets.
13. Ensure the project can run locally with a documented development command and can produce a production build.

## Non-Functional Requirements

- Keep setup simple enough for a 2-week build.
- Prefer widely used defaults over custom tooling.
- Maintain a predictable folder structure to reduce cognitive overhead.
- Avoid introducing infrastructure that requires significant ops maintenance.
- Ensure environment variables are not hardcoded into client-side code.
- Keep bootstrap decisions aligned with the agreed tech stack in the brief.

## Data Model

No application tables are required in this spec.

Infrastructure-related configuration artifacts introduced by this spec include:

- environment variable definitions in `.env.example`
- shared UI bootstrap configuration for shadcn/ui
- base Supabase client utilities
- test configuration files
- workflow definitions in `.github/workflows/`

## API Contract

No production feature endpoints are required in this spec.

Optional validation endpoints or placeholder routes may be added only if needed to verify the app scaffold, but they are not required for completion.

## UI/UX Notes

- The homepage can remain a minimal placeholder during this spec.
- The public UI does not need final branding or layout yet.
- Any bootstrap UI should make it obvious that the app is wired and running.
- One shadcn/ui-based component or verified setup path should exist to confirm the UI stack is functional.

## Design Patterns

- **Single Responsibility:** configuration files should each serve one purpose, such as linting, testing, or deployment.
- **Dependency Inversion:** later business logic should depend on environment-aware clients rather than direct SDK calls scattered across the app.
- **Factory:** if environment-based client creation is introduced here, it should be done through simple factory functions rather than inline instantiation everywhere.

## Test Cases

### Unit Tests

- Positive: a sample unit test runs successfully through the Jest configuration.
- Negative: invalid TypeScript or lint violations fail the configured checks.
- Edge: environment-dependent modules load safely when optional variables are absent during non-runtime test execution.

### Integration Tests

- Positive: the app starts locally and the root route returns a successful response.
- Negative: missing required Supabase environment variables for server-only database access fail with a clear error or documented fallback behavior.
- Edge: CI can run with placeholder environment setup for checks that do not require live third-party credentials.

### E2E Tests

- Positive: Playwright can launch the local app and confirm the homepage renders.
- Negative: a missing route returns the expected not-found behavior.
- Edge: the baseline test setup works in both local and CI execution contexts.

## Acceptance Criteria

- [ ] Next.js App Router project scaffold exists and runs locally.
- [ ] TypeScript strict mode is enabled.
- [ ] Tailwind CSS is installed and usable in app components.
- [ ] shadcn/ui base setup is installed and ready for shared UI components.
- [ ] ESLint and Prettier configurations are present and runnable.
- [ ] `.env.example` exists and documents required variables.
- [ ] Base Supabase client utilities exist for server-side database access wiring.
- [ ] Jest configuration is present and supports a passing baseline test.
- [ ] Playwright configuration is present and supports a passing baseline browser test.
- [ ] CI workflow exists and runs dependency install, typecheck, lint, and unit tests.
- [ ] Deploy workflow exists and is configured for Vercel deployment on `main`.
- [ ] Minimum required folder structure from the brief exists.
- [ ] Local development and production build commands are documented or encoded in `package.json` scripts.

## Sprint Tasks

1. Initialize the Next.js application with TypeScript and App Router.
2. Add Tailwind CSS and confirm styling works in the root app.
3. Install and initialize shadcn/ui base setup.
4. Create the minimum required folder structure for app, components, lib, hooks, types, docs/\_spec, supabase, tests, and workflow assets.
5. Configure ESLint, Prettier, and strict TypeScript settings.
6. Add `.env.example` and base environment access helpers.
7. Add base Supabase client wiring for server-side database access.
8. Configure Jest and add one baseline unit test.
9. Configure Playwright and add one baseline end-to-end test.
10. Create `ci.yml` with install, typecheck, lint, and unit test steps, and create `deploy.yml` for Vercel deployment.
11. Verify local dev, test, and build commands.
