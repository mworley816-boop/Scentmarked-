-- Private, conservative research budget ledger. Not activated until migration review.
create table if not exists public.atlas_research_budget_days (
 day date primary key,
 reserved_micros bigint not null default 0 check (reserved_micros >= 0),
 daily_limit_micros bigint not null check (daily_limit_micros > 0),
 constraint atlas_budget_within_limit check (reserved_micros <= daily_limit_micros),
 created_at timestamptz not null default now()
);
create table if not exists public.atlas_research_budget_reservations (
 id uuid primary key default gen_random_uuid(),
 day date not null references public.atlas_research_budget_days(day),
 reserved_usd_micros bigint not null check (reserved_usd_micros > 0),
 actual_usd_micros bigint check (actual_usd_micros >= 0 and actual_usd_micros <= reserved_usd_micros),
 settled_at timestamptz,
 created_at timestamptz not null default now(),
 constraint atlas_budget_settlement_consistency check ((settled_at is null) = (actual_usd_micros is null))
);
alter table public.atlas_research_budget_days enable row level security;
alter table public.atlas_research_budget_reservations enable row level security;
revoke all on public.atlas_research_budget_days from public, anon, authenticated;
revoke all on public.atlas_research_budget_reservations from public, anon, authenticated;
grant select, insert, update on public.atlas_research_budget_days to service_role;
grant select, insert, update on public.atlas_research_budget_reservations to service_role;

-- SECURITY INVOKER RPCs require explicit RLS policies for the service role.
-- Do not grant these policies to anon or authenticated.
create policy atlas_budget_days_service_select
 on public.atlas_research_budget_days for select to service_role using (true);
create policy atlas_budget_days_service_insert
 on public.atlas_research_budget_days for insert to service_role with check (true);
create policy atlas_budget_days_service_update
 on public.atlas_research_budget_days for update to service_role using (true) with check (true);
create policy atlas_budget_reservations_service_select
 on public.atlas_research_budget_reservations for select to service_role using (true);
create policy atlas_budget_reservations_service_insert
 on public.atlas_research_budget_reservations for insert to service_role with check (true);
create policy atlas_budget_reservations_service_update
 on public.atlas_research_budget_reservations for update to service_role using (true) with check (true);

-- Single-statement conditional UPSERT serializes competing reservations per day.
create or replace function public.atlas_reserve_research_budget(
 p_day date,p_daily_limit_micros bigint,p_amount_micros bigint
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
 if p_day is null or p_day <> (now() at time zone 'utc')::date
  or p_daily_limit_micros is null or p_daily_limit_micros <= 0
  or p_amount_micros is null or p_amount_micros <= 0
  or p_amount_micros > p_daily_limit_micros then
  raise exception 'Invalid Atlas research budget request';
 end if;
 insert into public.atlas_research_budget_days(day,reserved_micros,daily_limit_micros)
 values(p_day,p_amount_micros,p_daily_limit_micros)
 on conflict(day) do update
 set reserved_micros=public.atlas_research_budget_days.reserved_micros+excluded.reserved_micros
 where public.atlas_research_budget_days.daily_limit_micros = excluded.daily_limit_micros
 and public.atlas_research_budget_days.reserved_micros <= public.atlas_research_budget_days.daily_limit_micros-excluded.reserved_micros;
 if not found then return null; end if;
 insert into public.atlas_research_budget_reservations(day,reserved_usd_micros)
 values(p_day,p_amount_micros) returning id into v_id;
 return jsonb_build_object('id',v_id::text,'reserved_usd_micros',p_amount_micros);
end;
$$;

-- Settlement is idempotent and never refunds the reserved daily allowance.
-- Missing usage reconciliation leaves the full reservation charged against the cap.
create or replace function public.atlas_settle_research_budget(
 p_reservation_id uuid,p_actual_micros bigint
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_updated integer;
begin
 if p_reservation_id is null or p_actual_micros is null or p_actual_micros < 0 then
  raise exception 'Invalid Atlas budget settlement';
 end if;
 update public.atlas_research_budget_reservations
 set actual_usd_micros=p_actual_micros,settled_at=now()
 where id=p_reservation_id and settled_at is null and p_actual_micros<=reserved_usd_micros;
 get diagnostics v_updated=row_count;
 if v_updated=1 then return true; end if;
 return exists(
  select 1 from public.atlas_research_budget_reservations
  where id=p_reservation_id and actual_usd_micros=p_actual_micros and settled_at is not null
 );
end;
$$;
revoke all on function public.atlas_reserve_research_budget(date,bigint,bigint) from public,anon,authenticated;
revoke all on function public.atlas_settle_research_budget(uuid,bigint) from public,anon,authenticated;
grant execute on function public.atlas_reserve_research_budget(date,bigint,bigint) to service_role;
grant execute on function public.atlas_settle_research_budget(uuid,bigint) to service_role;
