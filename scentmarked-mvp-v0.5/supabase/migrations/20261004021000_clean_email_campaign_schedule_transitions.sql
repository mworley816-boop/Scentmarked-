create or replace function public.start_email_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  update public.email_campaigns
  set status='sending',
      scheduled_at=null,
      started_at=coalesce(started_at,now()),
      completed_at=null,
      updated_at=now()
  where id=p_campaign_id
    and(status='draft' or(status='scheduled' and scheduled_at is not null and scheduled_at<=now()));
  if not found then raise exception 'Campaign is not ready or its scheduled send time has not arrived';end if;
end $$;

create or replace function public.cancel_scheduled_email_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  update public.email_campaigns
  set status='draft',scheduled_at=null,started_at=null,completed_at=null,updated_at=now()
  where id=p_campaign_id and status='scheduled';
  if not found then raise exception 'Campaign is not scheduled';end if;
end $$;

revoke execute on function public.start_email_campaign(uuid) from anon;
revoke execute on function public.cancel_scheduled_email_campaign(uuid) from anon;
grant execute on function public.start_email_campaign(uuid) to authenticated,service_role;
grant execute on function public.cancel_scheduled_email_campaign(uuid) to authenticated,service_role;
