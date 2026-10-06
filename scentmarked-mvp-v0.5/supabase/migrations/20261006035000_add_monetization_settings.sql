create table if not exists public.monetization_settings (
 id text primary key,
 monthly_revenue_goal_cents bigint not null default 100000 check (monthly_revenue_goal_cents >= 0),
 currency text not null default 'USD',
 updated_at timestamptz not null default now()
);
alter table public.monetization_settings enable row level security;
revoke all on table public.monetization_settings from anon, authenticated;
grant select, insert, update on table public.monetization_settings to service_role;
insert into public.monetization_settings(id,monthly_revenue_goal_cents,currency)
values ('default',100000,'USD') on conflict (id) do nothing;
