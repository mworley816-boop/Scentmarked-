-- Read-only self-service view of the signed-in member's marketing preference.
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
 limit 1
$$;

revoke all on function public.get_my_marketing_preference() from public,anon;
grant execute on function public.get_my_marketing_preference() to authenticated;
