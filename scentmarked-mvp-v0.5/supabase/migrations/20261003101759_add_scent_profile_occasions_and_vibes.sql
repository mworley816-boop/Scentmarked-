alter table public.profiles
  add column if not exists scent_occasions text[] default '{}'::text[],
  add column if not exists scent_vibes text[] default '{}'::text[];
