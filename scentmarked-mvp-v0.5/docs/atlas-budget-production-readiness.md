# Atlas budget ledger: production readiness and approval gate

**Status (2026-11-17): BLOCKED — migration not applied.** This document does not authorize deployment, paid OpenAI requests, scheduled research, or publication.

## Verified read-only production inventory

Scentmarked Supabase project `qnlqdkctfmfagsvbwiis`:

| Object | Observed |
| --- | --- |
| `public.atlas_employee_tasks` | Present |
| `public.atlas_research_evidence_drafts` | Present |
| `public.atlas_research_budget_days` | Missing |
| `public.atlas_research_budget_reservations` | Missing |
| `public.atlas_reserve_research_budget(date,bigint,bigint)` | Missing |
| `public.atlas_settle_research_budget(uuid,bigint)` | Missing |

Inventory was obtained by a read-only `to_regclass` / `to_regprocedure` query. This does **not** establish that all other production permissions, triggers, or secrets are ready.

## Review before any migration

1. Review the committed migration `supabase/migrations/20261106170000_atlas_research_budget_ledger.sql` in its entirety, including service-role-only RLS, `SECURITY INVOKER` RPCs, privileges, atomic reservation, settlement, and idempotency.
2. Verify migration history and existing objects on the target project; review a backup/rollback plan. Do not run migrations against the wrong Supabase project.
3. Verify disposable-Postgres CI: `atlas-budget-ledger-tests` including role-isolation and concurrent reservations. Do not execute destructive test scripts against production.
4. Obtain **explicit operator approval** before applying any production migration.
5. After approval and application, rerun the object inventory, inspect RLS/policies and RPC grants, and run non-destructive verification. Never perform a paid provider call as a migration smoke test.
6. Independently verify provider credentials, current model pricing, daily cap, worst-case reserve, model/token ceilings, and alerting. Obtain **separate explicit approval** for any paid pilot.
7. Run a small, supervised, explicitly authorized pilot. All findings remain private drafts; graphics and catalog publication require separate review.

## Safe inventory query

```sql
select
 to_regclass('public.atlas_research_budget_days') as days_table,
 to_regclass('public.atlas_research_budget_reservations') as reservations_table,
 to_regprocedure('public.atlas_reserve_research_budget(date,bigint,bigint)') as reserve_rpc,
 to_regprocedure('public.atlas_settle_research_budget(uuid,bigint)') as settle_rpc,
 to_regclass('public.atlas_employee_tasks') as employee_tasks,
 to_regclass('public.atlas_research_evidence_drafts') as evidence_drafts;
```

**Stop conditions:** missing ledger objects, unexpected public/anon/authenticated privileges, failed disposable CI, unverified pricing/credentials, or missing operator approval. Keep paid research and automatic publishing disabled.
