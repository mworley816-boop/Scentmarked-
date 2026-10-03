-- Public unsubscribe support without exposing CRM contact IDs or emails.

alter table public.crm_contacts
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists crm_contacts_unsubscribe_token_key
  on public.crm_contacts(unsubscribe_token);

-- SECURITY DEFINER is intentional: anonymous visitors cannot update CRM rows directly.
-- The opaque UUID token is the only input and the function reveals no contact data.
create or replace function public.unsubscribe_crm_contact(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed boolean;
begin
  update public.crm_contacts
     set marketing_consent = false,
         marketing_consented_at = null,
         status = 'unsubscribed',
         unsubscribed_at = coalesce(unsubscribed_at, now()),
         updated_at = now()
   where unsubscribe_token = p_token
     and (marketing_consent = true or status <> 'unsubscribed');

  changed := found;

  -- Return success for a valid token even when already unsubscribed, making
  -- repeat clicks idempotent without revealing subscription state.
  if not changed then
    return exists (
      select 1 from public.crm_contacts where unsubscribe_token = p_token
    );
  end if;
  return true;
end;
$$;

revoke all on function public.unsubscribe_crm_contact(uuid) from public;
grant execute on function public.unsubscribe_crm_contact(uuid) to anon, authenticated;
