-- Evaluate every saved profile condition with AND semantics.
create or replace function public.email_profile_matches_rules(p public.profiles,p_rules jsonb)
returns boolean
language sql
immutable
as $$
 select
  (not (p_rules ? 'loved_note') or p.scent_loved_notes @> array[p_rules->>'loved_note']::text[])
  and (not (p_rules ? 'avoided_note') or p.scent_avoided_notes @> array[p_rules->>'avoided_note']::text[])
  and (not (p_rules ? 'vibe') or p.scent_vibes @> array[p_rules->>'vibe']::text[])
  and (not (p_rules ? 'occasion') or p.scent_occasions @> array[p_rules->>'occasion']::text[])
  and (not (p_rules ? 'presentation') or p.scent_presentations @> array[p_rules->>'presentation']::text[])
  and (not (p_rules ? 'sweetness_min') or coalesce(p.scent_sweetness,0)>=(p_rules->>'sweetness_min')::numeric)
  and (not (p_rules ? 'projection_min') or coalesce(p.scent_projection,0)>=(p_rules->>'projection_min')::numeric)
  and (not (p_rules ? 'longevity_min') or coalesce(p.scent_longevity,0)>=(p_rules->>'longevity_min')::numeric)
  and (not (p_rules ? 'max_price') or (p.scent_max_price is not null and p.scent_max_price<=(p_rules->>'max_price')::numeric));
$$;

create or replace function public.get_email_campaign_audience(p_campaign_id uuid)
returns table(contact_id uuid,email text,first_name text,unsubscribe_token uuid)
language plpgsql security invoker stable set search_path=public
as $$
declare v_segment_id bigint; v_rules jsonb; v_profile jsonb;
begin
 select segment_id into v_segment_id from public.email_campaigns where id=p_campaign_id;
 if not found then raise exception 'Campaign not found'; end if;
 if v_segment_id is null then
  return query select c.id,c.email,c.first_name,c.unsubscribe_token from public.crm_emailable_contacts c order by c.created_at;
  return;
 end if;
 select rules into v_rules from public.crm_segments where id=v_segment_id and is_active=true;
 if v_rules is null then raise exception 'Campaign segment is unavailable'; end if;
 v_profile:=coalesce(v_rules->'profile','{}'::jsonb);
 return query
 select c.id,c.email,c.first_name,c.unsubscribe_token
 from public.crm_emailable_contacts c
 left join public.profiles p on p.id=c.user_id
 where v_profile='{}'::jsonb or (p.id is not null and public.email_profile_matches_rules(p,v_profile))
 order by c.created_at;
end;
$$;

create or replace function public.count_email_segment_audience(p_segment_id bigint)
returns integer language plpgsql security invoker stable set search_path=public
as $$
declare v_rules jsonb; v_profile jsonb; v_count integer;
begin
 select rules into v_rules from public.crm_segments where id=p_segment_id and is_active=true;
 if v_rules is null then return 0; end if;
 v_profile:=coalesce(v_rules->'profile','{}'::jsonb);
 select count(*)::integer into v_count
 from public.crm_emailable_contacts c
 left join public.profiles p on p.id=c.user_id
 where v_profile='{}'::jsonb or (p.id is not null and public.email_profile_matches_rules(p,v_profile));
 return v_count;
end;
$$;

revoke all on function public.email_profile_matches_rules(public.profiles,jsonb) from public;
grant execute on function public.email_profile_matches_rules(public.profiles,jsonb) to authenticated;
revoke all on function public.get_email_campaign_audience(uuid) from public;
grant execute on function public.get_email_campaign_audience(uuid) to authenticated;
revoke all on function public.count_email_segment_audience(bigint) from public;
grant execute on function public.count_email_segment_audience(bigint) to authenticated;
