# Atlas import: isolated database verification

## Safety gate

**Never execute the fixture against the live Scentmarked Supabase project.**
The fixture opens a transaction and rolls back, but a disposable environment is still mandatory.
Do not provide production database credentials to test jobs.

## Current coverage

- `supabase/tests/atlas_import_security_preflight.sql`: RLS, RPC execute grants, ledger constraints.
- `supabase/tests/atlas_import_transaction_rollback.sql`: successful unpublished draft, idempotent retry, source and note links, revoked approval, invalid note and insecure source URL rejection.
- Not yet covered by executed database integration tests: concurrent import requests, forced source insertion failure, and conflicting catalog identities.

## Prerequisite: reproducible local schema

The repository currently has SQL migrations but no committed `supabase/config.toml`.
Before running the tests in CI, establish a disposable local Supabase instance and confirm that the repository migrations recreate all required tables, roles and RPCs from scratch. If migration replay fails, repair the migration baseline separately; **do not fall back to the live project**.

Follow the current Supabase CLI instructions at https://supabase.com/docs/guides/local-development/cli-workflows. Use `supabase --help` and relevant subcommand `--help` to confirm installed CLI syntax. Docker must be available.

## Execution requirements

1. Start a fresh local Supabase stack with Docker. Use a project-specific local configuration and no linked remote project.
2. Apply the full schema/migration baseline. Verify `atlas_research_queue`, `perfumes`, `perfume_notes`, `perfume_sources`, `atlas_catalog_imports`, and `import_approved_atlas_catalog_draft` exist.
3. Run the read-only security preflight with a local privileged SQL connection.
4. Run the transactional rollback fixture with the same local connection. Require a nonzero exit code on SQL errors (`psql -v ON_ERROR_STOP=1`).
5. Add separate fixtures for concurrent imports and forced source-insert failure, then execute them.
6. Record the command, database version, migration baseline, and test output in the pull request before marking the release gate complete.
7. Stop and destroy the local stack after testing.

## Release status

Documentation only. No local database test execution has been claimed. Issue #271 remains open until isolated execution and missing negative/concurrency coverage are confirmed.
