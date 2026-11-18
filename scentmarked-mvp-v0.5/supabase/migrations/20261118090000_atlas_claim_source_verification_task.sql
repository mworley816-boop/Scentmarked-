-- Claim only source-verification assignments for an automated, non-paid worker.
-- Other task kinds remain untouched; no graphics, model calls, or publication.
create or replace function public.atlas_claim_source_verification_task(p_lease_seconds integer default 300)
returns table(task_id uuid,perfume_id uuid,task_kind text,lease_token uuid,leased_until timestamptz)
language plpgsql security invoker set search_path=''
as $$
begin
 if p_lease_seconds not between 60 and 1800 then
  raise exception 'Invalid lease duration';
 end if;
 return query
 with candidate as (
  select t.id from public.atlas_employee_tasks t
  join public.perfumes p on p.id=t.perfume_id
  where t.task_kind='verify_sources'
    and (t.status='queued' or (t.status='running' and t.leased_until<pg_catalog.now()))
    and p.status<>'archived' and t.attempts<5
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
revoke all on function public.atlas_claim_source_verification_task(integer) from public,anon,authenticated;
grant execute on function public.atlas_claim_source_verification_task(integer) to service_role;
