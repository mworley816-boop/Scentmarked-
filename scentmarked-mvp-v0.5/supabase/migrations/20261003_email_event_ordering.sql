-- Preserve the most advanced meaningful delivery state when provider events arrive out of order.

create or replace function public.record_email_delivery_event(
  p_delivery_id bigint,
  p_event_type text,
  p_provider_event_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_contact_id uuid;
  v_current_status text;
  v_inserted integer;
  v_next_status text;
begin
  if p_event_type not in ('sent','delivered','opened','clicked','bounced','complained','failed','unsubscribed') then
    raise exception 'Unsupported email event type';
  end if;

  select contact_id,status into v_contact_id,v_current_status
  from public.email_deliveries
  where id=p_delivery_id
  for update;

  if v_contact_id is null then raise exception 'Delivery not found'; end if;

  insert into public.email_events(delivery_id,contact_id,event_type,provider_event_id,metadata)
  values(p_delivery_id,v_contact_id,p_event_type,p_provider_event_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict (provider_event_id) where provider_event_id is not null do nothing;

  get diagnostics v_inserted=row_count;
  if p_provider_event_id is not null and v_inserted=0 then return; end if;

  v_next_status:=case
    when p_event_type in ('bounced','complained','failed','unsubscribed') then p_event_type
    when v_current_status in ('bounced','complained','failed','unsubscribed') then v_current_status
    when p_event_type='clicked' then 'clicked'
    when p_event_type='opened' and v_current_status<>'clicked' then 'opened'
    when p_event_type='delivered' and v_current_status not in ('opened','clicked') then 'delivered'
    when p_event_type='sent' and v_current_status in ('queued','sent') then 'sent'
    else v_current_status
  end;

  update public.email_deliveries
  set status=v_next_status,
      sent_at=case when p_event_type='sent' then coalesce(sent_at,now()) else sent_at end,
      delivered_at=case when p_event_type in ('delivered','opened','clicked') then coalesce(delivered_at,now()) else delivered_at end,
      opened_at=case when p_event_type in ('opened','clicked') then coalesce(opened_at,now()) else opened_at end,
      clicked_at=case when p_event_type='clicked' then coalesce(clicked_at,now()) else clicked_at end,
      bounced_at=case when p_event_type='bounced' then coalesce(bounced_at,now()) else bounced_at end,
      failed_at=case when p_event_type='failed' then coalesce(failed_at,now()) else failed_at end
  where id=p_delivery_id;

  if p_event_type='bounced' then
    update public.crm_contacts set status='bounced',updated_at=now() where id=v_contact_id;
  elsif p_event_type='complained' then
    update public.crm_contacts set status='suppressed',marketing_consent=false,updated_at=now() where id=v_contact_id;
  elsif p_event_type='unsubscribed' then
    update public.crm_contacts set status='unsubscribed',marketing_consent=false,unsubscribed_at=coalesce(unsubscribed_at,now()),updated_at=now() where id=v_contact_id;
  elsif p_event_type in ('opened','clicked') then
    update public.crm_contacts set last_engaged_at=now(),updated_at=now() where id=v_contact_id;
  end if;
end;
$$;

revoke all on function public.record_email_delivery_event(bigint,text,text,jsonb) from public;
