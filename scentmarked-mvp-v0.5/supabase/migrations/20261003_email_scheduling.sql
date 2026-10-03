-- Admin scheduling helpers. A separate trusted worker can process campaigns once due.

create or replace function public.schedule_email_campaign(p_campaign_id uuid,p_scheduled_at timestamptz)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  if p_scheduled_at<=now() then raise exception 'Scheduled time must be in the future'; end if;
  if not exists (
    select 1 from public.email_deliveries
    where campaign_id=p_campaign_id and status='queued'
  ) then raise exception 'Prepare the campaign audience before scheduling'; end if;

  update public.email_campaigns
  set status='scheduled',scheduled_at=p_scheduled_at,updated_at=now()
  where id=p_campaign_id and status='draft';

  if not found then raise exception 'Only draft campaigns can be scheduled'; end if;
end;
$$;

create or replace function public.cancel_scheduled_email_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  update public.email_campaigns
  set status='draft',scheduled_at=null,updated_at=now()
  where id=p_campaign_id and status='scheduled';

  if not found then raise exception 'Campaign is not scheduled'; end if;
end;
$$;

revoke all on function public.schedule_email_campaign(uuid,timestamptz) from public;
revoke all on function public.cancel_scheduled_email_campaign(uuid) from public;
grant execute on function public.schedule_email_campaign(uuid,timestamptz) to authenticated;
grant execute on function public.cancel_scheduled_email_campaign(uuid) to authenticated;
