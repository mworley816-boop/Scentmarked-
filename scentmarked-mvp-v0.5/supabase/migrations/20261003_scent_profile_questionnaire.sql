-- Scent profile questionnaire fields.
-- Mirrors the additive migrations already applied to the production Supabase project.
alter table public.profiles
  add column if not exists scent_occasions text[] default '{}'::text[],
  add column if not exists scent_vibes text[] default '{}'::text[],
  add column if not exists scent_presentations text[] default '{}'::text[],
  add column if not exists scent_profile_completed_at timestamptz,
  add column if not exists scent_favorite_perfume_ids uuid[] default '{}'::uuid[];
