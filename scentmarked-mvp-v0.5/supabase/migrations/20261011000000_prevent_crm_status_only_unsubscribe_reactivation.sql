-- Applied to production as prevent_crm_status_only_unsubscribe_reactivation.
-- Keep the repository migration aligned with the installed CRM consent trigger.
create or replace function public.normalize_crm_contact_consent()
returns trigger language plpgsql set search_path=public as $$
begin
  -- A status-only change cannot undo an unsubscribe.
  if old.status='unsubscribed'
     and new.status='active'
     and not (old.marketing_consent is distinct from true and new.marketing_consent is true) then
    raise exception 'Unsubscribed contact requires renewed marketing consent'
      using errcode='23514';
  end if;
  if new.marketing_consent=true and old.marketing_consent is distinct from true then
    new.marketing_consented_at:=now();
    new.unsubscribed_at:=null;
    if new.status='unsubscribed' then new.status:='active'; end if;
  elsif new.marketing_consent=false and old.marketing_consent=true then
    new.marketing_consented_at:=null;
    new.unsubscribed_at:=coalesce(new.unsubscribed_at,now());
    if new.status='active' then new.status:='unsubscribed'; end if;
  end if;
  if new.status='unsubscribed' then
    new.marketing_consent:=false;
    new.marketing_consented_at:=null;
    new.unsubscribed_at:=coalesce(new.unsubscribed_at,now());
  end if;
  new.updated_at:=now();
  return new;
end $$;
