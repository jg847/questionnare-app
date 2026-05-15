# Spec: Source Code Export CLI

**ID:** SPEC-10  
**Status:** Draft  
**Sprint:** 6

## Summary

This spec defines a post-MVP CLI utility that exports selected repository source files into a single concatenated artifact under `exports/`. The tool exists to produce a portable snapshot of the codebase for review, archival, or external processing without manually collecting files across the repository.

## User Stories

- As a developer, I want to export the relevant source files into one output file so that I can review or share the current codebase state more easily.
- As a maintainer, I want generated files and dependency directories excluded so that the export stays focused and readable.
- As an admin or reviewer, I want file counts, line counts, and the output path printed after export so that I can confirm the export completed correctly.

## MVP Scope

### Must Exist for This Spec

- An executable script at `scripts/export-source.ts`
- Support for running the export via `npx ts-node scripts/export-source.ts`
- Support for running the export via `npm run export`
- Recursive collection of `.ts`, `.tsx`, `.sql`, and `.json` files
- Exclusion of lockfiles
- Exclusion of generated and dependency directories
- Creation of a concatenated export artifact under `exports/`
- Console output showing total files, total lines, and output path

### Must Already Exist Before This Spec Expands the Tooling

- A working TypeScript project scaffold
- The repository structure defined in the brief
- Enough implementation files in the repository for exporting to be useful

This spec is an enhancement for repository tooling and must not block MVP delivery.

### Can Be Stubbed or Deferred

- Configurable include and exclude patterns
- Multiple output formats
- Compression or archive packaging
- Per-file hashing or manifests
- Differential exports between revisions
- Rich CLI argument parsing beyond the brief's required commands

### Assumptions

- This feature is post-MVP and should be implemented only after the core product works.
- The export script runs from the repository root.
- The export artifact is intended for internal engineering workflows rather than end-user functionality.
- The script may use standard Node.js filesystem APIs and project TypeScript tooling already present in the repository.

## Functional Requirements

1. Create an executable TypeScript script at `scripts/export-source.ts`.
2. The script must be runnable with `npx ts-node scripts/export-source.ts`.
3. The repository must expose an `npm run export` command that runs the same script.
4. The script must recursively collect files ending in `.ts`, `.tsx`, `.sql`, and `.json`.
5. The script must exclude lockfiles from export output.
6. The script must exclude generated and dependency directories from traversal and export.
7. At minimum, excluded directories must include `node_modules`, `.next`, `exports`, and other generated output directories introduced by the project.
8. The script must write one concatenated export file under `exports/`.
9. The script must create the `exports/` directory if it does not already exist.
10. The export output must preserve enough file boundary information for a reader to tell where each file begins.
11. The script must print the total number of exported files.
12. The script must print the total number of exported lines.
13. The script must print the final output path.
14. The script must produce deterministic ordering of exported files so repeated runs over unchanged inputs produce stable output ordering.
15. The script must ignore unreadable or missing optional paths safely and fail clearly on unrecoverable write errors.
16. The script must operate on the local repository contents only and must not depend on network access.
17. The reported total line count must be defined deterministically as the sum of source-file lines exported, excluding any separator or file-boundary header lines added by the export format.

## Non-Functional Requirements

- Keep the implementation simple and dependency-light.
- Prefer built-in Node.js and TypeScript tooling over introducing a large CLI framework.
- Ensure export runtime is reasonable for a small-to-medium repository.
- Keep output readable enough for human inspection.
- Avoid accidental inclusion of bulky generated artifacts that would degrade export usefulness.

## Data Model

No database changes are required.

The export artifact is a filesystem output written under `exports/` and is not a persisted application data model.

## API Contract

This feature does not introduce HTTP APIs.

CLI contract:

- `npx ts-node scripts/export-source.ts`
- `npm run export`

Output behavior:

- writes a single concatenated export file under `exports/`
- prints total files, total lines, and output path to stdout
- excludes the generated `exports/` directory from traversal so repeated runs do not re-ingest prior export artifacts

Suggested output metadata format:

```ts
type ExportSummary = {
  totalFiles: number;
  totalLines: number;
  outputPath: string;
};
```

Suggested file boundary format within the export:

```text
===== FILE: path/to/file.ts =====
...file contents...
```

## UI/UX Notes

- This is a CLI tool, so usability depends on predictable command behavior and readable console output.
- Success output should be concise and immediately confirm what was exported.
- Failures should describe the path or operation that failed.
- The exported file should be easy to scan because file boundaries are explicit.

## Design Patterns

- **Single Responsibility:** separate directory traversal, file filtering, export formatting, and summary reporting.
- **Strategy:** file filtering rules can be represented as composable include and exclude checks without changing traversal logic.
- **Builder:** construct the final concatenated export output from ordered file sections.
- **Dependency Inversion:** keep filesystem access behind small utility boundaries if that makes testing simpler.

## Test Cases

### Unit Tests

- Positive: file filtering includes `.ts`, `.tsx`, `.sql`, and `.json` files.
- Positive: excluded directory rules skip dependency and generated directories.
- Positive: the `exports/` directory is excluded from traversal so prior export artifacts are never re-exported.
- Positive: lockfiles are excluded from the result set.
- Positive: exported files are sorted deterministically.
- Positive: total line counting excludes added file-boundary header lines.
- Negative: unsupported file extensions are excluded.
- Edge: empty eligible file sets still produce a valid export file and summary.

### Integration Tests

- Positive: running the script creates an export file under `exports/`.
- Positive: the export output includes explicit file headers and concatenated contents.
- Positive: the command prints total files, total lines, and output path.
- Positive: a second export run does not ingest the previously generated export artifact.
- Negative: write failures are surfaced clearly.
- Edge: nested directories are traversed recursively while excluded directories remain ignored.

### E2E Tests

- Positive: `npm run export` completes successfully in the repository and produces the expected artifact.
- Positive: `npx ts-node scripts/export-source.ts` completes successfully and reports the same summary shape.
- Negative: the command fails clearly if the output file cannot be written.
- Edge: repeated runs against unchanged inputs produce the same file ordering.

## Acceptance Criteria

- [ ] `scripts/export-source.ts` exists.
- [ ] The script runs via `npx ts-node scripts/export-source.ts`.
- [ ] The script runs via `npm run export`.
- [ ] The script recursively collects `.ts`, `.tsx`, `.sql`, and `.json` files.
- [ ] Lockfiles are excluded.
- [ ] Generated and dependency directories are excluded.
- [ ] The generated `exports/` directory is excluded from traversal and export.
- [ ] A concatenated export file is written under `exports/`.
- [ ] The export file contains explicit file boundaries.
- [ ] The script prints total files, total lines, and output path.
- [ ] Total line counting uses a deterministic definition that excludes added separator lines.
- [ ] Export ordering is deterministic for unchanged inputs.
- [ ] Unit, integration, and E2E coverage exist for filtering, output generation, and command execution.

## Sprint Tasks

1. Define the exact include and exclude rules for repository traversal.
2. Add the `scripts/export-source.ts` implementation.
3. Add the `npm run export` script entry.
4. Implement deterministic directory traversal and file ordering.
5. Implement concatenated output formatting with explicit file boundaries.
6. Exclude the generated `exports/` directory so repeated runs do not re-export prior artifacts.
7. Implement summary reporting for total files, total lines, and output path using the documented line-count definition.
8. Add tests for filtering, deterministic ordering, repeat-run behavior, and export output generation.
9. Validate both required invocation methods.
