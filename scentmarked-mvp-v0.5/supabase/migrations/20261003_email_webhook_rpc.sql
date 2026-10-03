-- Verified provider webhooks use one narrow SECURITY DEFINER entry point.
-- The caller supplies the provider message id; lookup and event mutation stay inside the database.

create or replace function public.record_provider_email_event(
  p_provider_message_id text,
  p_event_type text,
  p_provider_event_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_delivery_id bigint;
begin
  if p_provider_message_id is null or length(trim(p_provider_message_id))=0 then
    raise exception 'Provider message id is required';
  end if;

  select id into v_delivery_id
  from public.email_deliveries
  where provider_message_id=p_provider_message_id
  limit 1;

  if v_delivery_id is null then return false; end if;

  perform public.record_email_delivery_event(
    v_delivery_id,p_event_type,p_provider_event_id,coalesce(p_metadata,'{}'::jsonb)
  );
  return true;
end;
$$;

revoke all on function public.record_provider_email_event(text,text,text,jsonb) from public;
grant execute on function public.record_provider_email_event(text,text,text,jsonb) to anon;
