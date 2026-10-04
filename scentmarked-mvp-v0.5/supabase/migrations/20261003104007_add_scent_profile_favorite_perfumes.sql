alter table public.profiles
  add column if not exists scent_favorite_perfume_ids uuid[] default '{}'::uuid[];
