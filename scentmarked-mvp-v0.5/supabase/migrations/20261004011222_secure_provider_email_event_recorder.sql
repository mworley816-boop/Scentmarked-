create or replace function public.record_provider_email_event(
 p_provider_message_id text,
 p_event_type text,
 p_provider_event_id text default null,
 p_metadata jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
 d public.email_deliveries%rowtype;
 next_rank integer;
 current_rank integer;
begin
 if p_provider_message_id is null or btrim(p_provider_message_id)='' then return false; end if;
 if p_event_type not in ('sent','delivered','opened','clicked','bounced','complained','failed') then
   raise exception 'Unsupported provider email event';
 end if;

 select * into d from public.email_deliveries
 where provider_message_id=p_provider_message_id
 for update;
 if not found then return false; end if;

 if p_provider_event_id is not null and exists(
   select 1 from public.email_events where provider_event_id=p_provider_event_id
 ) then return false; end if;

 insert into public.email_events(delivery_id,contact_id,event_type,provider_event_id,metadata,occurred_at)
 values(d.id,d.contact_id,p_event_type,p_provider_event_id,coalesce(p_metadata,'{}'::jsonb),now());

 if p_event_type='complained' then
   update public.email_deliveries set status='complained' where id=d.id;
   update public.crm_contacts set status='suppressed',marketing_consent=false,marketing_consented_at=null,unsubscribed_at=coalesce(unsubscribed_at,now()),updated_at=now() where id=d.contact_id;
   return true;
 elsif p_event_type='bounced' then
   update public.email_deliveries set status='bounced',bounced_at=coalesce(bounced_at,now()) where id=d.id;
   update public.crm_contacts set status='bounced',marketing_consent=false,marketing_consented_at=null,updated_at=now() where id=d.contact_id;
   return true;
 elsif p_event_type='failed' then
   if d.status not in ('delivered','opened','clicked','bounced','complained','unsubscribed') then
     update public.email_deliveries set status='failed',failed_at=coalesce(failed_at,now()) where id=d.id;
   end if;
   return true;
 end if;

 current_rank:=case d.status when 'queued' then 0 when 'sent' then 1 when 'delivered' then 2 when 'opened' then 3 when 'clicked' then 4 else 100 end;
 next_rank:=case p_event_type when 'sent' then 1 when 'delivered' then 2 when 'opened' then 3 when 'clicked' then 4 else 0 end;
 if current_rank<100 and next_rank>current_rank then
   update public.email_deliveries set
    status=p_event_type,
    sent_at=case when next_rank>=1 then coalesce(sent_at,now()) else sent_at end,
    delivered_at=case when next_rank>=2 then coalesce(delivered_at,now()) else delivered_at end,
    opened_at=case when next_rank>=3 then coalesce(opened_at,now()) else opened_at end,
    clicked_at=case when next_rank>=4 then coalesce(clicked_at,now()) else clicked_at end
   where id=d.id;
 end if;
 return true;
end $$;

revoke all on function public.record_provider_email_event(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_provider_email_event(text,text,text,jsonb) to service_role;
