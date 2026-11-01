-- Integration test for approved Atlas research -> unpublished catalog draft.
-- Run in a disposable database or inside a transaction-aware SQL client.
-- All fixture changes are rolled back by the final ROLLBACK statement.
begin;
do $test$
declare
 v_id text := 'atlas-integration-' || substr(md5(random()::text),1,16);
 v_name text := 'Atlas Integration ' || substr(md5(random()::text),1,12);
 v_first uuid;
 v_second uuid;
 v_count integer;
 v_bad_id text := 'atlas-invalid-' || substr(md5(random()::text),1,16);
begin
 insert into public.atlas_research_queue
 (id,brand,perfume_name,manufacturer_url,source_notes,decision,status,reviewed_at,reviewed_by,review_note)
 values
 (v_id,'Atlas Integration Test',v_name,'https://example.org/test-perfume',
  '["Top: Vanilla","Heart: Caramel","Base: Musk"]'::jsonb,
  'needs_source_review','approved',now(),'integration-test','Approved for transaction test');

 v_first := public.import_approved_atlas_catalog_draft(v_id);
 if v_first is null then raise exception 'Import returned null'; end if;
 if (select status from public.perfumes where id=v_first) <> 'draft' then
  raise exception 'Imported perfume must remain unpublished';
 end if;
 v_second := public.import_approved_atlas_catalog_draft(v_id);
 if v_second is distinct from v_first then
  raise exception 'Retry created a different perfume';
 end if;
 select count(*) into v_count from public.atlas_catalog_imports where research_id=v_id;
 if v_count<>1 then raise exception 'Expected exactly one ledger entry'; end if;
 select count(*) into v_count from public.perfume_notes where perfume_id=v_first;
 if v_count<>3 then raise exception 'Expected three note links'; end if;
 select count(*) into v_count from public.perfume_sources where perfume_id=v_first;
 if v_count<>1 then raise exception 'Expected one provenance source'; end if;

 update public.atlas_research_queue set status='rejected',review_note='Revoked' where id=v_id;
 begin
  perform public.import_approved_atlas_catalog_draft(v_id);
  raise exception 'Revoked approval was incorrectly accepted';
 exception when others then
  if sqlerrm='Revoked approval was incorrectly accepted' then raise; end if;
  if sqlerrm<>'Atlas research is not approved for import' then raise; end if;
 end;
 -- Invalid notes must abort the import atomically: no draft, ledger or brand survives.
 insert into public.atlas_research_queue
 (id,brand,perfume_name,manufacturer_url,source_notes,decision,status,reviewed_at,reviewed_by,review_note)
 values
 (v_bad_id,'Atlas Invalid Test','Invalid ' || v_bad_id,'https://example.org/invalid',
  '["Top: Vanilla","Unsupported: Invalid"]'::jsonb,
  'needs_source_review','approved',now(),'integration-test','Approved for negative test');
 begin
  perform public.import_approved_atlas_catalog_draft(v_bad_id);
  raise exception 'Invalid note label was incorrectly accepted';
 exception when others then
  if sqlerrm='Invalid note label was incorrectly accepted' then raise; end if;
  if sqlerrm<>'Unsupported Atlas note label' then raise; end if;
 end;
 select count(*) into v_count from public.atlas_catalog_imports where research_id=v_bad_id;
 if v_count<>0 then raise exception 'Invalid import created a ledger entry'; end if;
 select count(*) into v_count from public.perfumes where name='Invalid ' || v_bad_id;
 if v_count<>0 then raise exception 'Invalid import created a draft'; end if;
 select count(*) into v_count from public.brands where name='Atlas Invalid Test';
 if v_count<>0 then raise exception 'Invalid import created a brand'; end if;
end
$test$;
rollback;
