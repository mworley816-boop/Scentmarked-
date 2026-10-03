-- Preview the current eligible audience size for a saved CRM segment.

create or replace function public.count_email_segment_audience(p_segment_id bigint)
returns integer
language plpgsql
security invoker
stable
set search_path = public
as $$
declare
  v_rules jsonb;
  v_profile jsonb;
  v_key text;
  v_value text;
  v_count integer;
begin
  select rules into v_rules
  from public.crm_segments
  where id=p_segment_id and is_active=true;

  if v_rules is null then return 0; end if;

  v_profile:=coalesce(v_rules->'profile','{}'::jsonb);
  select key,value #>> '{}' into v_key,v_value
  from jsonb_each(v_profile)
  limit 1;

  select count(*)::integer into v_count
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
     or (v_key='max_price' and coalesce(p.scent_max_price,0)<=v_value::numeric);

  return v_count;
end;
$$;

revoke all on function public.count_email_segment_audience(bigint) from public;
grant execute on function public.count_email_segment_audience(bigint) to authenticated;
