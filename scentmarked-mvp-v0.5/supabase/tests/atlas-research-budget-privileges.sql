-- Run ONLY on disposable/local PostgreSQL after Atlas ledger migration.
-- Uses read-only catalog privilege checks; no production database changes.
-- Requires a privileged local test connection able to inspect role grants.
begin;
do $$
declare
 role_name text;
 table_name text;
 function_signature text;
begin
 foreach role_name in array array['anon','authenticated'] loop
  foreach table_name in array array[
   'public.atlas_research_budget_days',
   'public.atlas_research_budget_reservations'
  ] loop
   if has_table_privilege(role_name,table_name,'SELECT') or
      has_table_privilege(role_name,table_name,'INSERT') or
      has_table_privilege(role_name,table_name,'UPDATE') or
      has_table_privilege(role_name,table_name,'DELETE') then
    raise exception 'Atlas budget table privilege leak: role %, table %',role_name,table_name;
   end if;
  end loop;
  foreach function_signature in array array[
   'public.atlas_reserve_research_budget(date,bigint,bigint)',
   'public.atlas_settle_research_budget(uuid,bigint)'
  ] loop
   if has_function_privilege(role_name,function_signature,'EXECUTE') then
    raise exception 'Atlas budget RPC privilege leak: role %, function %',role_name,function_signature;
   end if;
  end loop;
 end loop;
 foreach table_name in array array[
  'public.atlas_research_budget_days',
  'public.atlas_research_budget_reservations'
 ] loop
  if not (select relrowsecurity from pg_class where oid=table_name::regclass) then
   raise exception 'Atlas budget RLS disabled on %',table_name;
  end if;
 end loop;
 foreach function_signature in array array[
  'public.atlas_reserve_research_budget(date,bigint,bigint)',
  'public.atlas_settle_research_budget(uuid,bigint)'
 ] loop
  if not has_function_privilege('service_role',function_signature,'EXECUTE') then
   raise exception 'Atlas budget RPC missing service role grant: %',function_signature;
  end if;
  if (select prosecdef from pg_proc where oid=function_signature::regprocedure) then
   raise exception 'Atlas budget RPC unexpectedly SECURITY DEFINER: %',function_signature;
  end if;
 end loop;
end $$;
rollback;
