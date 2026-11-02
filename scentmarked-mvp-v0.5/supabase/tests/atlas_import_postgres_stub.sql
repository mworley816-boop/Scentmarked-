-- Disposable PostgreSQL-only prerequisites for Atlas SQL integration tests.
-- The queue fields are grounded in read-only production information_schema metadata.
-- This is not a full Supabase bootstrap and MUST NOT be deployed to production.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create table public.atlas_research_queue (
 id text primary key,
 brand text not null,
 perfume_name text not null,
 manufacturer_url text not null,
 source_notes jsonb not null default '[]'::jsonb,
 decision text not null,
 status text not null,
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by text,
 review_note text
);
