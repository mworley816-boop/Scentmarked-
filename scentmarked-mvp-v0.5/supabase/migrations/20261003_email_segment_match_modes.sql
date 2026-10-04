-- Allow each multi-value profile rule to choose ALL or ANY matching.
create or replace function public.email_profile_matches_rules(p public.profiles,p_rules jsonb,p_modes jsonb default '{}'::jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  k text;
  wanted text[];
  actual text[];
  mode text;
begin
  foreach k in array array['loved_note','avoided_note','vibe','occasion','presentation'] loop
    if p_rules ? k then
      wanted:=case when jsonb_typeof(p_rules->k)='array'
        then array(select jsonb_array_elements_text(p_rules->k))
        else array[p_rules->>k] end;
      actual:=case k
        when 'loved_note' then coalesce(p.scent_loved_notes,'{}'::text[])
        when 'avoided_note' then coalesce(p.scent_avoided_notes,'{}'::text[])
        when 'vibe' then coalesce(p.scent_vibes,'{}'::text[])
        when 'occasion' then coalesce(p.scent_occasions,'{}'::text[])
        when 'presentation' then coalesce(p.scent_presentations,'{}'::text[])
      end;
      mode:=coalesce(p_modes->>k,'all');
      if mode='any' then
        if not (actual && wanted) then return false; end if;
      else
        if not (actual @> wanted) then return false; end if;
      end if;
    end if;
  end loop;

  if p_rules ? 'sweetness_min' and coalesce(p.scent_sweetness,0)<(p_rules->>'sweetness_min')::numeric then return false; end if;
  if p_rules ? 'projection_min' and coalesce(p.scent_projection,0)<(p_rules->>'projection_min')::numeric then return false; end if;
  if p_rules ? 'longevity_min' and coalesce(p.scent_longevity,0)<(p_rules->>'longevity_min')::numeric then return false; end if;
  if p_rules ? 'max_price' and (p.scent_max_price is null or p.scent_max_price>(p_rules->>'max_price')::numeric) then return false; end if;
  return true;
end;
$$;

create or replace function public.get_email_campaign_audience(p_campaign_id uuid)
returns table(contact_id uuid,email text,first_name text,unsubscribe_token uuid)
language plpgsql security invoker stable set search_path=public
as $$
declare v_segment_id bigint; v_rules jsonb; v_profile jsonb; v_modes jsonb;
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
 v_modes:=coalesce(v_rules->'match_modes','{}'::jsonb);
 return query select c.id,c.email,c.first_name,c.unsubscribe_token
 from public.crm_emailable_contacts c left join public.profiles p on p.id=c.user_id
 where v_profile='{}'::jsonb or (p.id is not null and public.email_profile_matches_rules(p,v_profile,v_modes))
 order by c.created_at;
end;
$$;

create or replace function public.count_email_segment_audience(p_segment_id bigint)
returns integer language plpgsql security invoker stable set search_path=public
as $$
declare v_rules jsonb; v_profile jsonb; v_modes jsonb; v_count integer;
begin
 select rules into v_rules from public.crm_segments where id=p_segment_id and is_active=true;
 if v_rules is null then return 0; end if;
 v_profile:=coalesce(v_rules->'profile','{}'::jsonb);
 v_modes:=coalesce(v_rules->'match_modes','{}'::jsonb);
 select count(*)::integer into v_count
 from public.crm_emailable_contacts c left join public.profiles p on p.id=c.user_id
 where v_profile='{}'::jsonb or (p.id is not null and public.email_profile_matches_rules(p,v_profile,v_modes));
 return v_count;
end;
$$;

revoke all on function public.email_profile_matches_rules(public.profiles,jsonb,jsonb) from public;
grant execute on function public.email_profile_matches_rules(public.profiles,jsonb,jsonb) to authenticated;
