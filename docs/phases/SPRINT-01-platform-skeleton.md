# Sprint 01: Platform Skeleton

## Goal

Make the repository runnable, deployable, and ready for feature implementation.

## Linked Specs

- docs/\_spec/SPEC-01-project-bootstrap-infrastructure.md
- docs/\_spec/SPEC-02-database-schema-and-migrations.md

## Dependencies

- Sprint 00 complete

## Scope

- Next.js scaffold
- Tailwind and shadcn/ui setup
- Minimum required repository folder structure
- Supabase wiring
- SQL migrations
- Migration naming/versioning convention
- Seed data
- .env.example
- Jest and Playwright base configuration
- CI and deploy baseline
- Local development and production build command verification

## Deliverables

- Bootable Next.js app
- Configured TypeScript, lint, and formatting setup
- Required repository structure from the brief
- Supabase database schema under supabase/migrations
- Seed offer data and one active system prompt
- Working environment variable template
- Baseline test configuration
- CI and deploy workflow stubs or working baseline
- Documented or encoded local development and production build commands

## Tasks

1. Scaffold the application and repository structure.
2. Configure TypeScript, ESLint, Prettier, Tailwind, and shadcn/ui.
3. Wire Supabase clients and environment access.
4. Create the minimum required folder structure defined in the brief and SPEC-01.
5. Establish the migration naming/versioning convention for files under supabase/migrations.
6. Implement the required SQL migrations.
7. Add seed data for the initial offer catalog and one active system prompt.
8. Validate migration and seed execution against the local or target Supabase environment.
9. Create .env.example with all required variables.
10. Add Jest and Playwright base configs.
11. Add CI and deploy baseline workflows.
12. Verify local development and production build commands.

## Validation

- The app boots locally.
- The minimum required repository structure exists.
- Migrations run cleanly.
- Migration files follow the agreed naming/versioning convention.
- Seed data loads successfully, including one active system prompt.
- Migration and seed execution succeed against the intended Supabase environment.
- Type checking and linting run successfully.
- Local development and production build commands work.
- Deployment baseline is present.

## Exit Criteria

- The repository is ready for backend recommendation work.
- The schema and seed baseline are stable enough for recommendation-layer development.
- Sprint 02 can build on a stable schema and scaffold.

## Out of Scope

- Chat orchestration logic
- Homepage chat UI
- Admin authentication
- Offer CRUD UI
