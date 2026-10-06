create table if not exists public.monetization_goal_history (
 month_start date primary key,
 goal_cents bigint not null check (goal_cents >= 0),
 currency text not null default 'USD',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.monetization_goal_history enable row level security;
revoke all on table public.monetization_goal_history from anon, authenticated;
grant select, insert, update on table public.monetization_goal_history to service_role;
insert into public.monetization_goal_history(month_start,goal_cents,currency)
select date_trunc('month',now())::date,monthly_revenue_goal_cents,currency
from public.monetization_settings where id='default'
on conflict (month_start) do nothing;
