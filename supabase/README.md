# Supabase Bootstrap Notes

Sprint 01 uses timestamp-prefixed SQL filenames for migrations and seed files.

## Naming Convention

- Migrations: `YYYYMMDDHHMM_description.sql`
- Seeds: `YYYYMMDDHHMM_seed_description.sql`

## Current Files

- Migration: `supabase/migrations/202605140001_initial_schema.sql`
- Seed: `supabase/seed/202605140001_seed_initial_data.sql`

## Execution

Apply the migration file before applying the seed file in your target Supabase project.

If you are using the Supabase dashboard, execute the migration SQL first and the seed SQL second in the SQL editor.

If you want a repository-side sanity check before applying SQL, run:

- `npm run db:verify`

That command validates that the expected migration and seed directories exist and that their SQL files follow the agreed timestamp-prefixed naming convention.

If you are using the Supabase CLI with a linked project, apply the SQL in the same order represented here: migration first, then seed.

The seed file assumes the schema from the migration already exists and leaves exactly one prompt active for MVP development.
