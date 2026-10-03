-- Requeue only failed deliveries whose contacts are still eligible.

create or replace function public.retry_failed_email_deliveries(p_campaign_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  retry_count integer;
begin
  update public.email_deliveries d
  set status='queued',
      failed_at=null,
      error_message=null,
      provider_message_id=null
  where d.campaign_id=p_campaign_id
    and d.status='failed'
    and exists (
      select 1 from public.crm_emailable_contacts c
      where c.id=d.contact_id
    );

  get diagnostics retry_count = row_count;

  if retry_count>0 then
    update public.email_campaigns
    set status='draft', completed_at=null, updated_at=now()
    where id=p_campaign_id and status='failed';
  end if;

  return retry_count;
end;
$$;

revoke all on function public.retry_failed_email_deliveries(uuid) from public;
grant execute on function public.retry_failed_email_deliveries(uuid) to authenticated;
