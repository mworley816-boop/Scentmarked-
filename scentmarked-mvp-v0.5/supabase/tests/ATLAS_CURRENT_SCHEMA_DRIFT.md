# Atlas database baseline: current public table inventory

Read-only inventory from the production project's `information_schema.tables` on 2026-11-02. **Names only; no row data or credentials exported.**

## Current state

- **44** public base tables found.
- The 2026-10-03 recovery inventory documents **21** public tables. Its table list is stale and must not be treated as a current executable bootstrap.
- The recovered `baseline/001_public_schema.sql` and `002_indexes.sql` are useful starting points, but do not establish full schema replay.

## Additional tables absent from the older 21-table inventory

`affiliate_attribution_audit`, `atlas_catalog_imports`, `atlas_research_queue`, `community_profiles`, `crm_contact_tags`, `crm_contacts`, `crm_notes`, `crm_segments`, `crm_tags`, `email_campaigns`, `email_deliveries`, `email_events`, `email_templates`, `member_subscriptions`, `membership_plans`, `monetization_expenses`, `monetization_goal_history`, `monetization_settings`, `monetization_transactions`, `perfume_aliases`, `sponsorship_campaigns`, `sponsorship_events`, `taste_profile_revisions`.

## Safe next steps

1. For each additional table, map the defining migration or explicitly mark it as missing from source control.
2. Reconcile the 2026-10-03 baseline with the current table definitions, constraints, functions, triggers, grants, RLS and storage.
3. Prove clean-room replay in a disposable local Supabase environment before running Atlas SQL fixtures.
4. Keep issue #271 open; no database integration test execution is implied by this inventory.

**Never run reconstruction or rollback fixtures on the live production database.**
