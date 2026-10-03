-- Resolve a campaign audience using its saved CRM segment rules.
-- Segment rules are created by the existing Admin segment builder.

create or replace function public.get_email_campaign_audience(p_campaign_id uuid)
returns table (
  contact_id uuid,
  email text,
  first_name text,
  unsubscribe_token uuid
)
language plpgsql
security invoker
stable
set search_path = public
as $$
declare
  v_segment_id bigint;
  v_rules jsonb;
  v_profile jsonb;
  v_key text;
  v_value text;
begin
  select segment_id into v_segment_id
  from public.email_campaigns
  where id=p_campaign_id;

  if not found then raise exception 'Campaign not found'; end if;

  if v_segment_id is null then
    return query
    select c.id,c.email,c.first_name,c.unsubscribe_token
    from public.crm_emailable_contacts c
    order by c.created_at;
    return;
  end if;

  select rules into v_rules
  from public.crm_segments
  where id=v_segment_id and is_active=true;

  if v_rules is null then raise exception 'Campaign segment is unavailable'; end if;

  v_profile:=coalesce(v_rules->'profile','{}'::jsonb);
  select key,value #>> '{}' into v_key,v_value
  from jsonb_each(v_profile)
  limit 1;

  return query
  select c.id,c.email,c.first_name,c.unsubscribe_token
  from public.crm_emailable_contacts c
  left join public.profiles p on p.id=c.user_id
  where v_key is null
     or (v_key='loved_note' and p.scent_loved_notes @> array[v_value]::text[])
     or (v_key='avoided_note' and p.scent_avoided_notes @> array[v_value]::text[])
     or (v_key='vibe' and p.scent_vibes @> array[v_value]::text[])
     or (v_key='occasion' and p.scent_occasions @> array[v_value]::text[])
     or (v_key='presentation' and p.scent_presentations @> array[v_value]::text[])
     or (v_key='sweetness_min' and coalesce(p.scent_sweetness,0)>=v_value::numeric)
     or (v_key='projection_min' and coalesce(p.scent_projection,0)>=v_value::numeric)
     or (v_key='longevity_min' and coalesce(p.scent_longevity,0)>=v_value::numeric)
     or (v_key='max_price' and coalesce(p.scent_max_price,0)<=v_value::numeric)
  order by c.created_at;
end;
$$;

revoke all on function public.get_email_campaign_audience(uuid) from public;
grant execute on function public.get_email_campaign_audience(uuid) to authenticated;

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
    where id=p_campaign_id and status='draft'
  ) then raise exception 'Campaign must be a draft'; end if;

  insert into public.email_deliveries (campaign_id,contact_id,status)
  select p_campaign_id,contact_id,'queued'
  from public.get_email_campaign_audience(p_campaign_id)
  on conflict (campaign_id,contact_id) do nothing;

  get diagnostics queued_count=row_count;
  return queued_count;
end;
$$;
