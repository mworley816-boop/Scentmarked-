-- Allow a signed-in member to manage only their own marketing consent.
-- Bounce/complaint suppression cannot be overridden through self-service.

create or replace function public.set_my_marketing_consent(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
 uid uuid;
 current_status text;
begin
 uid:=auth.uid();
 if uid is null then raise exception 'Authentication required'; end if;

 select status into current_status
 from public.crm_contacts
 where user_id=uid
 for update;

 if not found then return false; end if;

 if p_enabled and current_status in ('bounced','suppressed') then
   raise exception 'Marketing email cannot be re-enabled while this address is suppressed';
 end if;

 update public.crm_contacts
 set marketing_consent=p_enabled
 where user_id=uid;

 return found;
end $$;

revoke all on function public.set_my_marketing_consent(boolean) from public,anon;
grant execute on function public.set_my_marketing_consent(boolean) to authenticated;
