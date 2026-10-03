-- Campaign lifecycle helpers for the protected admin email workflow.

create or replace function public.start_email_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.email_campaigns
  set status='sending', started_at=coalesce(started_at,now()), updated_at=now()
  where id=p_campaign_id and status in ('draft','scheduled');

  if not found then raise exception 'Campaign is not ready to send'; end if;
end;
$$;

create or replace function public.finish_email_campaign(p_campaign_id uuid, p_has_failures boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.email_campaigns
  set status=case when p_has_failures then 'failed' else 'sent' end,
      completed_at=now(),
      updated_at=now()
  where id=p_campaign_id and status='sending';

  if not found then raise exception 'Campaign is not currently sending'; end if;
end;
$$;

revoke all on function public.start_email_campaign(uuid) from public;
revoke all on function public.finish_email_campaign(uuid,boolean) from public;
grant execute on function public.start_email_campaign(uuid) to authenticated;
grant execute on function public.finish_email_campaign(uuid,boolean) to authenticated;
