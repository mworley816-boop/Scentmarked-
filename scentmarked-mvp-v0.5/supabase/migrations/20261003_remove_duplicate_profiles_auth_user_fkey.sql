-- profiles_id_fkey already enforces profiles.id -> auth.users.id ON DELETE CASCADE.
-- Remove the redundant second foreign key so the relationship is enforced once.
alter table public.profiles
  drop constraint if exists profiles_auth_user_fkey;
