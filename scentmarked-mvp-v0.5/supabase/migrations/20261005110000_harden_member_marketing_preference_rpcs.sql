-- Harden member-only marketing preference RPCs against anonymous-auth sessions.

create or replace function public.set_my_marketing_consent(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare uid uuid; current_status text;
begin
 uid:=auth.uid();
 if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Authenticated member account required'; end if;
 select status into current_status from public.crm_contacts where user_id=uid for update;
 if not found then return false; end if;
 if p_enabled and current_status in ('bounced','suppressed') then raise exception 'Marketing email cannot be re-enabled while this address is suppressed'; end if;
 update public.crm_contacts set marketing_consent=p_enabled where user_id=uid;
 return found;
end $$;
revoke all on function public.set_my_marketing_consent(boolean) from public,anon;
grant execute on function public.set_my_marketing_consent(boolean) to authenticated;

create or replace function public.get_my_marketing_preference()
returns table(status text,marketing_consent boolean,marketing_consented_at timestamptz,unsubscribed_at timestamptz)
language sql
stable
security definer
set search_path=''
as $$
 select c.status,c.marketing_consent,c.marketing_consented_at,c.unsubscribed_at
 from public.crm_contacts c
 where c.user_id=auth.uid()
   and auth.uid() is not null
   and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 limit 1
$$;
revoke all on function public.get_my_marketing_preference() from public,anon;
grant execute on function public.get_my_marketing_preference() to authenticated;
