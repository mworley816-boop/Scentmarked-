create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  taste_label text,
  show_taste_badge boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.community_profiles enable row level security;

drop policy if exists "community profiles public read" on public.community_profiles;
create policy "community profiles public read" on public.community_profiles for select to anon, authenticated using (true);

drop policy if exists "community profiles self update" on public.community_profiles;
create policy "community profiles self update" on public.community_profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select on public.community_profiles to anon, authenticated;
grant update (show_taste_badge) on public.community_profiles to authenticated;

insert into public.community_profiles (user_id, display_name, taste_label)
select p.id, nullif(trim(p.display_name), ''),
case
 when family.value is not null and note.value is not null then family.value || ' · ' || note.value
 when family.value is not null then family.value || ' Lover'
 when note.value is not null then note.value || ' Lover'
 when p.scent_sweetness between 4 and 5 then 'Sweet Scent Lover'
 when p.scent_sweetness between 1 and 2 then 'Low-Sweetness Scent Lover'
 when p.scent_sweetness = 3 then 'Balanced Scent Lover'
 else null end
from public.profiles p
left join lateral (select x as value from unnest(coalesce(p.scent_loved_notes,'{}'::text[])) with ordinality t(x,n) where lower(trim(x))=any(array['gourmand','fruity','floral','fresh','citrus','woody','amber','spicy','musky','aquatic','green','smoky']) order by n limit 1) family on true
left join lateral (select x as value from unnest(coalesce(p.scent_loved_notes,'{}'::text[])) with ordinality t(x,n) where lower(trim(x))<>all(array['gourmand','fruity','floral','fresh','citrus','woody','amber','spicy','musky','aquatic','green','smoky']) and trim(x)<>'' order by n limit 1) note on true
on conflict(user_id) do update set display_name=excluded.display_name,taste_label=excluded.taste_label,updated_at=now();

create or replace function public.sync_community_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare family text; note text; label text;
begin
 select x into family from unnest(coalesce(new.scent_loved_notes,'{}'::text[])) with ordinality t(x,n) where lower(trim(x))=any(array['gourmand','fruity','floral','fresh','citrus','woody','amber','spicy','musky','aquatic','green','smoky']) order by n limit 1;
 select x into note from unnest(coalesce(new.scent_loved_notes,'{}'::text[])) with ordinality t(x,n) where lower(trim(x))<>all(array['gourmand','fruity','floral','fresh','citrus','woody','amber','spicy','musky','aquatic','green','smoky']) and trim(x)<>'' order by n limit 1;
 label:=case when family is not null and note is not null then family||' · '||note when family is not null then family||' Lover' when note is not null then note||' Lover' when new.scent_sweetness between 4 and 5 then 'Sweet Scent Lover' when new.scent_sweetness between 1 and 2 then 'Low-Sweetness Scent Lover' when new.scent_sweetness=3 then 'Balanced Scent Lover' else null end;
 insert into public.community_profiles(user_id,display_name,taste_label,updated_at) values(new.id,nullif(trim(new.display_name),''),label,now())
 on conflict(user_id) do update set display_name=excluded.display_name,taste_label=excluded.taste_label,updated_at=excluded.updated_at;
 return new;
end; $$;

revoke all on function public.sync_community_profile() from public, anon, authenticated;
drop trigger if exists sync_community_profile_after_change on public.profiles;
create trigger sync_community_profile_after_change after insert or update of display_name,scent_loved_notes,scent_sweetness on public.profiles for each row execute function public.sync_community_profile();
