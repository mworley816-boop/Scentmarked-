# Atlas disposable database: bootstrap gap inventory

Reviewed against the repository on 2026-11-02. **This is an inventory, not an executable bootstrap or proof of test success.**

## Existing schema recovery assets

- `supabase/baseline/001_public_schema.sql`: reconstructed core public tables (from production metadata, 2026-10-03).
- `supabase/baseline/002_indexes.sql`: reconstructed standalone indexes.
- `supabase/migrations/PRODUCTION_*.md`: reference inventories for columns, constraints, defaults, extensions/grants, functions/triggers, RLS, storage and policies.
- `supabase/migrations/README.md` explicitly states the checked-in migration directory is **not a complete bootstrap history**.
- The Atlas RPC and ledger are defined in `20261101100000_atlas_atomic_catalog_import.sql` and `20261101090000_atlas_catalog_import_ledger.sql`.

## Gaps to close before enabling CI database execution

1. Reconcile the recovered table/index SQL with the *current* schema, including changes since 2026-10-03.
2. Reconstruct and review function/trigger, RLS, role/grant, extension, and storage baseline layers from the documented inventories. Preserve the `auth.users` profile provisioning trigger; avoid copying live auth records or secrets.
3. Establish an ordered, replayable migration strategy. Do not blindly apply the recovered baseline over production or run overlapping migrations twice.
4. Commit a minimal local Supabase configuration after verifying it against current CLI documentation and a disposable instance.
5. Prove a fresh local database can replay the schema, then run `atlas_import_security_preflight.sql` and `atlas_import_transaction_rollback.sql` with `ON_ERROR_STOP=1`.
6. Add and execute concurrency and forced-failure fixtures; keep issue #271 open until they pass.

## Explicit safety rule

Do not connect test workflows to the live Supabase project. Do not put production database credentials into GitHub Actions test jobs. A rollback fixture is not a substitute for isolation.
