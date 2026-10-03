# Production functions and triggers

Verified against the ScentMarked production Supabase project on 2026-10-03.

This is a recovery reference, not an executable migration.

## Public functions

Production currently exposes one function in the `public` schema:

### public.handle_new_user()

- Type: trigger function
- Security: `SECURITY DEFINER`
- Search path: `public`
- Purpose: provision a matching `public.profiles` row when a new Supabase Auth user is created.

Verified production behavior:

```sql
begin
  insert into public.profiles(id, display_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
```

When this function is recreated in an executable baseline, preserve the production `SECURITY DEFINER` behavior and explicit `search_path = public`.

## Application trigger

Production has one application trigger visible across the `public` and `auth` schemas:

- Trigger: `on_auth_user_created`
- Table: `auth.users`
- Timing: `AFTER INSERT`
- Action: execute `handle_new_user()`

Conceptually:

```sql
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

This trigger is required for the current signup/onboarding flow. The application updates the user's profile during onboarding; without profile provisioning, a newly created Auth user may not have a row available to update.

## Recovery requirement

The final executable baseline must create `public.handle_new_user()` and `on_auth_user_created` in the correct order after `public.profiles` exists. Avoid adding duplicate Auth-user creation triggers during restoration.
