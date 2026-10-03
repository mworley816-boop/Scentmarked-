-- Prevent a scheduled campaign from being started before its due time.
-- Draft campaigns remain available for explicit admin "send now" actions.

create or replace function public.start_email_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  update public.email_campaigns
  set status='sending',
      started_at=coalesce(started_at,now()),
      updated_at=now()
  where id=p_campaign_id
    and (
      status='draft'
      or (status='scheduled' and scheduled_at is not null and scheduled_at<=now())
    );

  if not found then
    raise exception 'Campaign is not ready or its scheduled send time has not arrived';
  end if;
end;
$$;

revoke all on function public.start_email_campaign(uuid) from public;
grant execute on function public.start_email_campaign(uuid) to authenticated;
