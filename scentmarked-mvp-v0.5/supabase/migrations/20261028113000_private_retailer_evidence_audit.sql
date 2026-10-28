-- Mirrors the already-applied Scentmarked production schema.
-- Private: never expose atlas_private through the Supabase Data API.
create schema if not exists atlas_private;
revoke all on schema atlas_private from public, anon, authenticated;

create table if not exists atlas_private.retailer_evidence_audit (
  id bigint generated always as identity primary key,
  perfume_id uuid not null,
  brand text not null check (length(trim(brand)) between 1 and 500),
  perfume_name text not null check (length(trim(perfume_name)) between 1 and 500),
  merchant_name text not null check (length(trim(merchant_name)) between 1 and 500),
  product_url text not null check (product_url like 'https://%'),
  source_url text not null check (source_url like 'https://%'),
  evidence_note text not null check (length(trim(evidence_note)) between 1 and 500),
  observed_at timestamptz not null,
  outcome text not null check (outcome in ('dry_run','draft_created','duplicate')),
  published boolean not null default false check (published = false),
  requires_admin_approval boolean not null default true check (requires_admin_approval = true),
  created_at timestamptz not null default now()
);
alter table atlas_private.retailer_evidence_audit enable row level security;
revoke all on atlas_private.retailer_evidence_audit from public, anon, authenticated;
revoke all on sequence atlas_private.retailer_evidence_audit_id_seq from public, anon, authenticated;
grant usage on schema atlas_private to service_role;
grant select, insert on atlas_private.retailer_evidence_audit to service_role;
grant usage on sequence atlas_private.retailer_evidence_audit_id_seq to service_role;
-- No policies for browser-facing roles, no public RPC, and no publication.
