-- Narrow interface for trusted scheduled email processing.
-- Returns only campaign ids that are scheduled and currently due.

create or replace function public.get_due_email_campaigns(p_limit integer default 10)
returns table (campaign_id uuid)
language sql
security invoker
stable
set search_path=public
as $$
  select id
  from public.email_campaigns
  where status='scheduled'
    and scheduled_at is not null
    and scheduled_at<=now()
  order by scheduled_at asc
  limit greatest(1,least(coalesce(p_limit,10),50));
$$;

revoke all on function public.get_due_email_campaigns(integer) from public;
grant execute on function public.get_due_email_campaigns(integer) to authenticated;
