create or replace function public.release_email_delivery_claims(p_delivery_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_count integer;
begin
  update public.email_deliveries
  set status='queued',processing_started_at=null
  where id=any(coalesce(p_delivery_ids,'{}'::uuid[]))
    and status='processing';
  get diagnostics v_count=row_count;
  return v_count;
end $$;

revoke execute on function public.release_email_delivery_claims(uuid[]) from anon;
grant execute on function public.release_email_delivery_claims(uuid[]) to authenticated,service_role;
