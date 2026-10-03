-- Automatically keep ScentMarked members linked to CRM contacts.
-- Account creation is NOT marketing consent. Existing CRM consent/status is preserved.

create or replace function public.sync_member_to_crm_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_email text;
  member_name text;
  existing_contact_id uuid;
begin
  member_email := nullif(trim(new.email), '');
  if member_email is null then
    return new;
  end if;

  member_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  -- Prefer an already-linked contact. Otherwise claim the existing contact for
  -- the same email. Do not overwrite consent, unsubscribe, suppression, or
  -- engagement fields when linking an existing CRM record.
  select id into existing_contact_id
  from public.crm_contacts
  where user_id = new.id
     or lower(email) = lower(member_email)
  order by case when user_id = new.id then 0 else 1 end
  limit 1;

  if existing_contact_id is not null then
    update public.crm_contacts
       set user_id = new.id,
           email = member_email,
           first_name = coalesce(first_name, member_name),
           updated_at = now()
     where id = existing_contact_id;
  else
    insert into public.crm_contacts (
      user_id, email, first_name, source, status, marketing_consent
    ) values (
      new.id, member_email, member_name, 'scentmarked_member', 'active', false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sync_member_to_crm_contact_on_auth_user on auth.users;
create trigger sync_member_to_crm_contact_on_auth_user
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_member_to_crm_contact();

-- Backfill existing members without changing any existing contact's consent or
-- delivery status. New contacts are created as non-marketing contacts.
insert into public.crm_contacts (
  user_id, email, first_name, source, status, marketing_consent
)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), ''),
  'scentmarked_member',
  'active',
  false
from auth.users u
where u.email is not null
  and not exists (
    select 1
    from public.crm_contacts c
    where c.user_id = u.id or lower(c.email) = lower(u.email)
  )
on conflict do nothing;

update public.crm_contacts c
set user_id = u.id,
    updated_at = now()
from auth.users u
where c.user_id is null
  and u.email is not null
  and lower(c.email) = lower(u.email);
