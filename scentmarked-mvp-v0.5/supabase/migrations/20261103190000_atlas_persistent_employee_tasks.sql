-- Persistent, private Atlas assignments. This migration does not schedule workers,
-- authorize graphics, or modify published catalog data.
create table if not exists public.atlas_employee_tasks (
 id uuid primary key default gen_random_uuid(),
 perfume_id uuid not null references public.perfumes(id) on delete cascade,
 task_kind text not null check(task_kind in
 ('research_description','verify_notes','verify_sources','research_graphic','verify_image_rights')),
 status text not null default 'queued' check(status in
 ('queued','running','awaiting_review','completed','failed','cancelled')),
 requires_approval boolean not null default false,
 attempts integer not null default 0 check(attempts>=0),
 lease_token uuid,
 leased_until timestamptz,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint atlas_graphics_must_require_approval check (
 task_kind not in ('research_graphic','verify_image_rights') or requires_approval),
 constraint atlas_running_lease_consistency check (
 (status='running') = (lease_token is not null and leased_until is not null)),
 unique(perfume_id,task_kind)
);
create index if not exists atlas_employee_tasks_next_idx
 on public.atlas_employee_tasks(status,created_at,id);
alter table public.atlas_employee_tasks enable row level security;
revoke all on public.atlas_employee_tasks from public,anon,authenticated;
grant select,insert,update on public.atlas_employee_tasks to service_role;

-- Only trusted server workers with service-role privileges may claim tasks.
-- SKIP LOCKED prevents multiple workers from claiming the same row.
create or replace function public.atlas_claim_employee_task(p_lease_seconds integer default 300)
returns table(task_id uuid, perfume_id uuid, task_kind text, lease_token uuid, leased_until timestamptz)
language plpgsql security invoker set search_path=''
as $$
begin
 if p_lease_seconds not between 30 and 1800 then
  raise exception 'Invalid lease duration';
 end if;
 return query
 with candidate as (
  select t.id from public.atlas_employee_tasks t
  join public.perfumes p on p.id=t.perfume_id
  where (t.status='queued' or
   (t.status='running' and t.leased_until<pg_catalog.now()))
   and p.status<>'archived'
   and t.attempts<5
  order by t.created_at,t.id
  for update of t skip locked
  limit 1
 ), claimed as (
  update public.atlas_employee_tasks t
  set status='running',attempts=t.attempts+1,
      lease_token=gen_random_uuid(),
      leased_until=pg_catalog.now()+pg_catalog.make_interval(secs=>p_lease_seconds),
      updated_at=pg_catalog.now(),last_error=null
  from candidate c where t.id=c.id
  returning t.id,t.perfume_id,t.task_kind,t.lease_token,t.leased_until
 )
 select c.id,c.perfume_id,c.task_kind,c.lease_token,c.leased_until from claimed c;
end;
$$;
revoke all on function public.atlas_claim_employee_task(integer) from public,anon,authenticated;
grant execute on function public.atlas_claim_employee_task(integer) to service_role;

-- A completion is accepted only from the current lease holder.
-- Graphics stop at awaiting_review: this function never changes perfumes.image_url.
create or replace function public.atlas_finish_employee_task(
 p_task_id uuid,p_lease_token uuid,p_success boolean,p_error text default null)
returns boolean language plpgsql security invoker set search_path=''
as $$
declare v_updated integer;
begin
 update public.atlas_employee_tasks t
 set status=case when p_success then
    case when t.requires_approval then 'awaiting_review' else 'completed' end
    else case when t.attempts>=5 then 'failed' else 'queued' end end,
     lease_token=null,leased_until=null,
     last_error=case when p_success then null else pg_catalog.left(pg_catalog.coalesce(p_error,'Worker failed'),1000) end,
     updated_at=pg_catalog.now()
 where t.id=p_task_id and t.lease_token=p_lease_token
   and t.status='running' and t.leased_until>=pg_catalog.now();
 get diagnostics v_updated=row_count;
 return v_updated=1;
end;
$$;
revoke all on function public.atlas_finish_employee_task(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.atlas_finish_employee_task(uuid,uuid,boolean,text) to service_role;
