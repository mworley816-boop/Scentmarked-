-- Read-only preflight. Run after both Atlas migrations are applied.
-- Throws on incorrect permissions or missing objects. Does not import perfumes.
do $$
begin
 if to_regclass('public.atlas_catalog_imports') is null then
  raise exception 'Missing Atlas import ledger';
 end if;
 if to_regprocedure('public.import_approved_atlas_catalog_draft(text,text,text,integer,text)') is null then
  raise exception 'Missing Atlas atomic import RPC';
 end if;
 if not (select relrowsecurity from pg_class where oid='public.atlas_catalog_imports'::regclass) then
  raise exception 'Atlas import ledger RLS must be enabled';
 end if;
 if has_table_privilege('anon','public.atlas_catalog_imports','SELECT')
  or has_table_privilege('authenticated','public.atlas_catalog_imports','SELECT')
  or has_table_privilege('authenticated','public.atlas_catalog_imports','INSERT') then
  raise exception 'Atlas import ledger exposed to browser roles';
 end if;
 if has_function_privilege('anon','public.import_approved_atlas_catalog_draft(text,text,text,integer,text)','EXECUTE')
  or has_function_privilege('authenticated','public.import_approved_atlas_catalog_draft(text,text,text,integer,text)','EXECUTE') then
  raise exception 'Atlas import RPC exposed to browser roles';
 end if;
 if not has_function_privilege('service_role','public.import_approved_atlas_catalog_draft(text,text,text,integer,text)','EXECUTE') then
  raise exception 'Service role cannot execute Atlas import RPC';
 end if;
 if not exists (select 1 from pg_constraint where conrelid='public.atlas_catalog_imports'::regclass and contype='p') then
  raise exception 'Missing unique research ID primary key';
 end if;
 if not exists (
  select 1 from pg_constraint where conrelid='public.atlas_catalog_imports'::regclass
   and contype='u' and pg_get_constraintdef(oid) like 'UNIQUE (perfume_id)%'
 ) then
  raise exception 'Missing unique perfume mapping';
 end if;
end $$;
