-- Consent and campaign-recipient safety for ScentMarked CRM.

-- A single reusable definition of contacts eligible for marketing.
create or replace view public.crm_emailable_contacts
with (security_invoker = true)
as
select c.*
from public.crm_contacts c
where c.status = 'active'
  and c.marketing_consent = true
  and c.marketing_consented_at is not null
  and c.unsubscribed_at is null;

-- Keep consent timestamps and unsubscribe state internally consistent.
create or replace function public.normalize_crm_contact_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.marketing_consent = true and old.marketing_consent is distinct from true then
    new.marketing_consented_at := coalesce(new.marketing_consented_at, now());
    new.unsubscribed_at := null;
    if new.status = 'unsubscribed' then new.status := 'active'; end if;
  elsif new.marketing_consent = false and old.marketing_consent = true then
    new.marketing_consented_at := null;
    new.unsubscribed_at := coalesce(new.unsubscribed_at, now());
    if new.status = 'active' then new.status := 'unsubscribed'; end if;
  end if;

  if new.status = 'unsubscribed' then
    new.marketing_consent := false;
    new.marketing_consented_at := null;
    new.unsubscribed_at := coalesce(new.unsubscribed_at, now());
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists normalize_crm_contact_consent_before_update on public.crm_contacts;
create trigger normalize_crm_contact_consent_before_update
before update of marketing_consent, status on public.crm_contacts
for each row execute function public.normalize_crm_contact_consent();

-- Campaign delivery rows may only be queued for a currently eligible contact.
-- This is a second line of defense behind application audience filtering.
create or replace function public.enforce_email_delivery_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'queued' and not exists (
    select 1 from public.crm_emailable_contacts c where c.id = new.contact_id
  ) then
    raise exception 'Contact is not eligible for marketing email delivery';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_delivery_consent_before_write on public.email_deliveries;
create trigger enforce_email_delivery_consent_before_write
before insert or update of contact_id, status on public.email_deliveries
for each row execute function public.enforce_email_delivery_consent();
