-- Run only against a disposable/local Supabase database AFTER applying the
-- Atlas research budget ledger migration. Entire test rolls back.
-- Requires a privileged test connection able to SET LOCAL ROLE service_role.
begin;
set local role service_role;
do $$
declare
 d date := (now() at time zone 'utc')::date;
 first jsonb;
 second jsonb;
 rejected jsonb;
 settled boolean;
 count_reservations integer;
begin
 -- Daily limit 1000 micros, two reservations of 400 each.
 first := public.atlas_reserve_research_budget(d,1000,400);
 second := public.atlas_reserve_research_budget(d,1000,400);
 if first is null or second is null then
  raise exception 'Expected two reservations';
 end if;
 rejected := public.atlas_reserve_research_budget(d,1000,400);
 if rejected is not null then raise exception 'Budget exceeded without rejection'; end if;
 rejected := public.atlas_reserve_research_budget(d,2000,100);
 if rejected is not null then raise exception 'Daily cap was increased'; end if;
 settled := public.atlas_settle_research_budget((first->>'id')::uuid,250);
 if settled is distinct from true then raise exception 'Settlement failed'; end if;
 settled := public.atlas_settle_research_budget((first->>'id')::uuid,250);
 if settled is distinct from true then raise exception 'Idempotent settlement failed'; end if;
 settled := public.atlas_settle_research_budget((first->>'id')::uuid,251);
 if settled is distinct from false then raise exception 'Conflicting settlement accepted'; end if;
 select count(*) into count_reservations
 from public.atlas_research_budget_reservations where day=d;
 if count_reservations<>2 then raise exception 'Unexpected reservation count'; end if;
 if (select reserved_micros from public.atlas_research_budget_days where day=d)<>800 then
  raise exception 'Settlement incorrectly refunded reserved allowance';
 end if;
end $$;
rollback;

-- Additional checks to perform separately in two concurrent local psql
-- sessions: begin both, reserve against the same day and cap, commit both;
-- verify the combined reservation amount never exceeds the daily limit.
-- Verify anon/authenticated roles cannot select either table or execute RPCs.
