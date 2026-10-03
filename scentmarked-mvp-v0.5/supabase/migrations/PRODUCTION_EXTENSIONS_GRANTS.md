# Production extensions and grants

Verified against production Supabase on 2026-10-03. Recovery reference only.

## Installed extensions

- pg_stat_statements 1.11 — schema `extensions`
- pgcrypto 1.3 — schema `extensions`
- plpgsql 1.0 — schema `pg_catalog`
- supabase_vault 0.3.1 — schema `vault`
- uuid-ossp 1.1 — schema `extensions`

A fresh Supabase environment may provide some of these as platform defaults. The executable recovery baseline should only explicitly manage extensions that the application schema actually requires, rather than assuming every platform-managed extension should be recreated manually.

## Role/table grant observations

The production grant inventory was checked for `anon`, `authenticated`, and `service_role`.

Most public tables expose broad PostgreSQL table privileges to `anon` and/or `authenticated`, as is common in a Supabase schema where Row Level Security provides row-level authorization. These grants MUST NOT be interpreted as proof that those roles can actually read or mutate every row. Exact RLS policies remain part of the recovery baseline.

Important exceptions/special cases observed:

- `profiles`: `anon` and `authenticated` have DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, but **not UPDATE** at table level. `service_role` has UPDATE as well.
- `affiliate_clicks`: `anon` has INSERT only; `authenticated` has INSERT and SELECT; `service_role` has full table privileges.
- `perfume_affiliate_offers`: `anon` has REFERENCES, SELECT, TRIGGER, TRUNCATE but not INSERT/UPDATE/DELETE; `authenticated` and `service_role` have the broader table grants.

For other public tables in the production inventory, the inspected roles generally have the standard broad table grant set, with effective access expected to be constrained by RLS.

## Recovery warning

Do not reconstruct authorization from this file alone. PostgreSQL grants and Supabase RLS are separate layers. A recovery is not security-equivalent to production until both the role grants and exact RLS/storage policy expressions have been restored and tested.
