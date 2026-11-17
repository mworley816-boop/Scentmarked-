# Atlas budget ledger: production readiness and approval gate

**Status (2026-11-17): Budget ledger migration applied and security objects verified; paid pilot NOT authorized.** This document does not authorize paid OpenAI requests, scheduled research, or publication.

## Verified read-only production inventory

Scentmarked Supabase project `qnlqdkctfmfagsvbwiis`:

| Object | Observed |
| --- | --- |
| `public.atlas_employee_tasks` | Present |
| `public.atlas_research_evidence_drafts` | Present |
| `public.atlas_research_budget_days` | Present (verified after migration) |
| `public.atlas_research_budget_reservations` | Present (verified after migration) |
| `public.atlas_reserve_research_budget(date,bigint,bigint)` | Present (verified after migration) |
| `public.atlas_settle_research_budget(uuid,bigint)` | Present (verified after migration) |

The pre-migration inventory was obtained read-only. The approved migration was subsequently applied to this Scentmarked production project and recorded in Supabase migration history as `20261117151622` (`atlas_research_budget_ledger`). Post-migration checks confirmed RLS enabled on both budget tables, no anonymous/authenticated SELECT, service-role access, and both RPCs as `SECURITY INVOKER` with EXECUTE denied to anonymous/authenticated roles. This does **not** establish that provider credentials, pricing, alerting, or pilot permissions are ready.

## Migration review record and remaining pilot gates

1. Completed: reviewed and applied the committed migration `supabase/migrations/20261106170000_atlas_research_budget_ledger.sql` in its entirety, including service-role-only RLS, `SECURITY INVOKER` RPCs, privileges, atomic reservation, settlement, and idempotency.
2. Completed: verified migration history and ledger objects on the Scentmarked target project. Do not reapply the migration.
3. Verify disposable-Postgres CI: `atlas-budget-ledger-tests` including role-isolation and concurrent reservations. Do not execute destructive test scripts against production.
4. Completed: operator explicitly approved the production migration before it was applied.
5. Completed: checked object inventory, RLS and RPC grants using non-destructive verification. No paid provider call was used as a migration smoke test.
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

**Stop conditions for paid pilot:** missing ledger objects, unexpected public/anon/authenticated privileges, failed disposable CI, unverified pricing/credentials, or missing operator approval. Keep paid research and automatic publishing disabled.

See [`atlas-supervised-pilot-activation-gates.md`](./atlas-supervised-pilot-activation-gates.md) for the separate supervised pilot authorization checklist.
