-- One-to-one durable mapping for retry-safe approved Atlas catalog imports.
-- This ledger does not import or publish anything on its own.
create table if not exists public.atlas_catalog_imports (
  research_id text primary key references public.atlas_research_queue(id) on delete restrict,
  perfume_id uuid not null unique references public.perfumes(id) on delete restrict,
  imported_at timestamptz not null default now(),
  constraint atlas_catalog_import_research_id_length check (length(research_id) between 1 and 160)
);

alter table public.atlas_catalog_imports enable row level security;

-- The ledger is intentionally inaccessible from browser sessions. A future
-- reviewed server-side transaction will use a privileged service connection
-- only after independently checking the caller's admin status.
revoke all on public.atlas_catalog_imports from public, anon, authenticated;
grant select, insert on public.atlas_catalog_imports to service_role;

comment on table public.atlas_catalog_imports is
  'Private idempotency ledger: one approved Atlas research ID maps to exactly one catalog perfume. No public access or automatic publication.';
