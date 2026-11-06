-- Trusted service-only draft persistence. The current task lease must match.
-- Does not approve, publish, or change catalog graphics.
create or replace function public.atlas_save_employee_evidence_draft(
 p_task_id uuid,p_lease_token uuid,p_proposed_text text,p_sources jsonb,
 p_image_reference jsonb default null,p_rights_status text default null)
returns uuid language plpgsql security invoker set search_path=''
as $$
declare v_task public.atlas_employee_tasks%rowtype; v_id uuid; v_source jsonb;
begin
 select * into v_task from public.atlas_employee_tasks
 where id=p_task_id and lease_token=p_lease_token
 and status='running' and leased_until>pg_catalog.now()
 for update;
 if not found then raise exception 'Atlas lease is not active'; end if;
 if nullif(pg_catalog.btrim(p_proposed_text),'') is null then
  raise exception 'Missing proposed research text';
 end if;
 if p_sources is null or pg_catalog.jsonb_typeof(p_sources)<>'array'
   or pg_catalog.jsonb_array_length(p_sources)=0 then
  raise exception 'Evidence sources are required';
 end if;
 for v_source in select value from pg_catalog.jsonb_array_elements(p_sources) loop
  if pg_catalog.jsonb_typeof(v_source)<>'object'
   or nullif(pg_catalog.btrim(v_source->>'claim'),'') is null
   or (v_source->>'url') !~ '^https://[^[:space:]@/]+(/|$)' then
   raise exception 'Invalid research source citation';
  end if;
 end loop;
 if p_image_reference is not null and
   (pg_catalog.jsonb_typeof(p_image_reference)<>'object'
    or (p_image_reference->>'url') !~ '^https://[^[:space:]@/]+(/|$)') then
  raise exception 'Invalid image reference';
 end if;
 if p_image_reference is not null and
   v_task.task_kind not in ('research_graphic','verify_image_rights') then
  raise exception 'Image references require graphics review';
 end if;
 if p_image_reference is not null and
   (p_rights_status is null or p_rights_status not in ('unverified','verified')) then
  raise exception 'Image rights status is required';
 end if;
 insert into public.atlas_research_evidence_drafts(
  task_id,perfume_id,task_kind,proposed_text,sources,
  image_reference,rights_status)
 values (v_task.id,v_task.perfume_id,v_task.task_kind,p_proposed_text,
  p_sources,p_image_reference,p_rights_status)
 returning id into v_id;
 return v_id;
end;
$$;
revoke all on function public.atlas_save_employee_evidence_draft(uuid,uuid,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.atlas_save_employee_evidence_draft(uuid,uuid,text,jsonb,jsonb,text) to service_role;
