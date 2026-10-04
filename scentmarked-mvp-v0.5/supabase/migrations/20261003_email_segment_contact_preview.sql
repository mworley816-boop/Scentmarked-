-- Return a small consent-safe preview of contacts currently matching a segment.
create or replace function public.preview_email_segment_audience(p_segment_id bigint,p_limit integer default 25)
returns table(contact_id uuid,email text,first_name text,last_name text)
language plpgsql
security invoker
stable
set search_path=public
as $$
declare v_rules jsonb; v_profile jsonb; v_modes jsonb; v_limit integer;
begin
 select rules into v_rules from public.crm_segments where id=p_segment_id and is_active=true;
 if v_rules is null then return; end if;
 v_profile:=coalesce(v_rules->'profile','{}'::jsonb);
 v_modes:=coalesce(v_rules->'match_modes','{}'::jsonb);
 v_limit:=greatest(1,least(coalesce(p_limit,25),50));
 return query
 select c.id,c.email,c.first_name,c.last_name
 from public.crm_emailable_contacts c
 left join public.profiles p on p.id=c.user_id
 where v_profile='{}'::jsonb or (p.id is not null and public.email_profile_matches_rules(p,v_profile,v_modes))
 order by c.created_at desc
 limit v_limit;
end;
$$;
revoke all on function public.preview_email_segment_audience(bigint,integer) from public;
grant execute on function public.preview_email_segment_audience(bigint,integer) to authenticated;
