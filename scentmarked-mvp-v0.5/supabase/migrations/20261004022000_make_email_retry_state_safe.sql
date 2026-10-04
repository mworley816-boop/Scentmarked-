create or replace function public.retry_failed_email_deliveries(p_campaign_id uuid)
returns integer
language plpgsql
security invoker
set search_path=public
as $$
declare n integer;
begin
  if not exists(select 1 from public.email_campaigns where id=p_campaign_id and status='failed') then
    raise exception 'Only failed campaigns can be retried';
  end if;

  update public.email_deliveries d
  set status='queued',
      failed_at=null,
      error_message=null,
      provider_message_id=null,
      processing_started_at=null
  where d.campaign_id=p_campaign_id
    and d.status='failed'
    and exists(select 1 from public.crm_emailable_contacts c where c.id=d.contact_id);
  get diagnostics n=row_count;

  if n>0 then
    update public.email_campaigns
    set status='draft',started_at=null,completed_at=null,scheduled_at=null,updated_at=now()
    where id=p_campaign_id and status='failed';
  end if;
  return n;
end $$;

revoke execute on function public.retry_failed_email_deliveries(uuid) from anon;
grant execute on function public.retry_failed_email_deliveries(uuid) to authenticated,service_role;
