# ScentMarked Supabase migrations

This directory is **not yet a complete database bootstrap history**.

The production Supabase project contains earlier migrations and schema objects that predate the SQL files currently checked into this repository. In particular, production includes the core catalog/member schema, RLS policies, indexes, storage policies, affiliate/recommendation/contact tables, and the Auth-user profile provisioning trigger/function.

The SQL files in this directory currently document only the newer changes that were added to source control:

- `20261003_scent_profile_questionnaire.sql`
- `20261003_remove_duplicate_profiles_auth_user_fkey.sql`

Do not initialize a new ScentMarked Supabase project by running only this directory; it will be incomplete.

Before using repository migrations as a disaster-recovery or fresh-environment bootstrap, export/reconstruct the production migration baseline, review it for secrets and environment-specific data, and commit the verified schema history in migration order.

Production currently provisions `public.profiles` for new Auth users with an `auth.users` trigger named `on_auth_user_created` calling `public.handle_new_user()`. Preserve that behavior when the baseline is captured.
