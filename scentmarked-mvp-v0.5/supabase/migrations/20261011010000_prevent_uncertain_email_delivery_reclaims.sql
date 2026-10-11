-- Never automatically retry a delivery whose provider outcome may be unknown.
-- Processing rows must be investigated and reconciled explicitly before requeueing.
create or replace function public.claim_email_delivery_batch(p_campaign_id uuid,p_limit integer default 25)
returns table(delivery_id uuid)
language plpgsql
security invoker
set search_path=public
as $$
begin
  return query
  with candidates as (
    select id from public.email_deliveries
    where campaign_id=p_campaign_id and status='queued'
    order by id
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,25),100))
  ), claimed as (
    update public.email_deliveries d
    set status='processing',processing_started_at=now()
    from candidates c
    where d.id=c.id
    returning d.id
  )
  select id from claimed;
end $$;

revoke execute on function public.claim_email_delivery_batch(uuid,integer) from public,anon;
grant execute on function public.claim_email_delivery_batch(uuid,integer) to authenticated,service_role;
