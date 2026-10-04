alter table public.profiles
  add column if not exists scent_presentations text[] default '{}'::text[],
  add column if not exists scent_profile_completed_at timestamptz;
