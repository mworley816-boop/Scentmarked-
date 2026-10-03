-- Queue a campaign for all currently emailable contacts.
-- Live provider delivery remains a separate step.

create or replace function public.queue_email_campaign(p_campaign_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  queued_count integer;
begin
  if not exists (
    select 1 from public.email_campaigns
    where id = p_campaign_id and status = 'draft'
  ) then
    raise exception 'Campaign must be a draft';
  end if;

  insert into public.email_deliveries (campaign_id, contact_id, status)
  select p_campaign_id, contact_id, 'queued'
  from public.get_email_campaign_audience()
  on conflict (campaign_id, contact_id) do nothing;

  get diagnostics queued_count = row_count;
  return queued_count;
end;
$$;

revoke all on function public.queue_email_campaign(uuid) from public;
grant execute on function public.queue_email_campaign(uuid) to authenticated;
