-- Private, review-only storage for Atlas research evidence.
-- No trigger, worker schedule, publication or graphics placement.
create table if not exists public.atlas_research_evidence_drafts (
 id uuid primary key default gen_random_uuid(),
 task_id uuid not null references public.atlas_employee_tasks(id) on delete cascade,
 perfume_id uuid not null references public.perfumes(id) on delete cascade,
 task_kind text not null check (task_kind in ('research_description','verify_notes','verify_sources','research_graphic','verify_image_rights')),
 proposed_text text not null check (length(btrim(proposed_text))>0),
 sources jsonb not null check (jsonb_typeof(sources)='array' and jsonb_array_length(sources)>0),
 image_reference jsonb,
 rights_status text check (rights_status in ('unverified','verified')),
 review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
 reviewed_at timestamptz,
 reviewed_by uuid,
 created_at timestamptz not null default now(),
 constraint atlas_evidence_graphics_review check (
   image_reference is null or task_kind in ('research_graphic','verify_image_rights')
 ),
 constraint atlas_evidence_rights_status check (
   image_reference is null or rights_status is not null
 ),
 constraint atlas_evidence_review_metadata check (
   (review_status='pending' and reviewed_at is null and reviewed_by is null)
   or (review_status in ('approved','rejected') and reviewed_at is not null and reviewed_by is not null)
 )
);
create index if not exists atlas_evidence_drafts_pending_idx
 on public.atlas_research_evidence_drafts(review_status,created_at);
alter table public.atlas_research_evidence_drafts enable row level security;
revoke all on public.atlas_research_evidence_drafts from public,anon,authenticated;
grant select,insert,update on public.atlas_research_evidence_drafts to service_role;
comment on table public.atlas_research_evidence_drafts is
 'Private research proposals only. Approval is not publication; graphics placement requires a separate authorized workflow.';
