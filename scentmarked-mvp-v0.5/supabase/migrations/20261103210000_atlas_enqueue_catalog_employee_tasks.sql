-- Explicit, service-only queue synchronization for catalog enrichment.
-- Does not schedule a worker, create graphics, or publish catalog changes.
create or replace function public.atlas_enqueue_catalog_employee_tasks(p_limit integer default 500)
returns integer language plpgsql security invoker set search_path=''
as $$
declare v_count integer;
begin
 if p_limit not between 1 and 5000 then
  raise exception 'Invalid Atlas enqueue limit';
 end if;
 with eligible as (
  select p.id as perfume_id, kinds.task_kind,
    (kinds.task_kind in ('research_graphic','verify_image_rights')) as requires_approval
  from public.perfumes p
  cross join lateral (
   select 'research_description'::text as task_kind where nullif(pg_catalog.btrim(p.description),'') is null
   union all
   select 'verify_notes' where not exists
     (select 1 from public.perfume_notes n where n.perfume_id=p.id)
   union all
   select 'verify_sources' where not exists
     (select 1 from public.perfume_sources s where s.perfume_id=p.id)
   union all
   select 'research_graphic' where p.image_url is null or pg_catalog.btrim(p.image_url)=''
   union all
   select 'verify_image_rights' where p.image_url is not null
     and pg_catalog.btrim(p.image_url)<>''
     and not exists(select 1 from public.perfume_image_provenance v where v.perfume_id=p.id)
  ) kinds
  where p.status<>'archived'
  order by p.id,kinds.task_kind
  limit p_limit
 ), inserted as (
  insert into public.atlas_employee_tasks(perfume_id,task_kind,requires_approval)
  select e.perfume_id,e.task_kind,e.requires_approval from eligible e
  on conflict(perfume_id,task_kind) do nothing
  returning id
 )
 select pg_catalog.count(*)::integer into v_count from inserted;
 return v_count;
end;
$$;
revoke all on function public.atlas_enqueue_catalog_employee_tasks(integer) from public,anon,authenticated;
grant execute on function public.atlas_enqueue_catalog_employee_tasks(integer) to service_role;
comment on function public.atlas_enqueue_catalog_employee_tasks(integer) is
 'Private, idempotent catalog task discovery. Existing assignments and approvals are never reset.';
