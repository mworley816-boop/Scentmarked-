-- Support arrays of checked segment values while remaining compatible with older scalar rules.
create or replace function public.email_profile_matches_rules(p public.profiles,p_rules jsonb)
returns boolean
language sql
immutable
as $$
 select
  (not (p_rules ? 'loved_note') or coalesce(p.scent_loved_notes,'{}'::text[]) @> case when jsonb_typeof(p_rules->'loved_note')='array' then array(select jsonb_array_elements_text(p_rules->'loved_note')) else array[p_rules->>'loved_note'] end)
  and (not (p_rules ? 'avoided_note') or coalesce(p.scent_avoided_notes,'{}'::text[]) @> case when jsonb_typeof(p_rules->'avoided_note')='array' then array(select jsonb_array_elements_text(p_rules->'avoided_note')) else array[p_rules->>'avoided_note'] end)
  and (not (p_rules ? 'vibe') or coalesce(p.scent_vibes,'{}'::text[]) @> case when jsonb_typeof(p_rules->'vibe')='array' then array(select jsonb_array_elements_text(p_rules->'vibe')) else array[p_rules->>'vibe'] end)
  and (not (p_rules ? 'occasion') or coalesce(p.scent_occasions,'{}'::text[]) @> case when jsonb_typeof(p_rules->'occasion')='array' then array(select jsonb_array_elements_text(p_rules->'occasion')) else array[p_rules->>'occasion'] end)
  and (not (p_rules ? 'presentation') or coalesce(p.scent_presentations,'{}'::text[]) @> case when jsonb_typeof(p_rules->'presentation')='array' then array(select jsonb_array_elements_text(p_rules->'presentation')) else array[p_rules->>'presentation'] end)
  and (not (p_rules ? 'sweetness_min') or coalesce(p.scent_sweetness,0)>=(p_rules->>'sweetness_min')::numeric)
  and (not (p_rules ? 'projection_min') or coalesce(p.scent_projection,0)>=(p_rules->>'projection_min')::numeric)
  and (not (p_rules ? 'longevity_min') or coalesce(p.scent_longevity,0)>=(p_rules->>'longevity_min')::numeric)
  and (not (p_rules ? 'max_price') or (p.scent_max_price is not null and p.scent_max_price<=(p_rules->>'max_price')::numeric));
$$;

revoke all on function public.email_profile_matches_rules(public.profiles,jsonb) from public;
grant execute on function public.email_profile_matches_rules(public.profiles,jsonb) to authenticated;
