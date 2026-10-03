-- Return only contacts who are currently eligible for marketing campaigns.
create or replace function public.get_email_campaign_audience()
returns table (
  contact_id uuid,
  email text,
  first_name text,
  unsubscribe_token uuid
)
language sql
security invoker
stable
set search_path = public
as $$
  select id, email, first_name, unsubscribe_token
  from public.crm_emailable_contacts
  order by created_at;
$$;

revoke all on function public.get_email_campaign_audience() from public;
grant execute on function public.get_email_campaign_audience() to authenticated;
