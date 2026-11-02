-- Additional Atlas approval-gate cases; disposable PostgreSQL only.
begin;
do $test$
declare
  v_id text;
  v_case text;
  v_error text;
  v_count integer;
begin
  for v_case in select unnest(array['pending','missing_reviewer','missing_review_time','missing_review_note','duplicate']) loop
    v_id := 'atlas-gate-' || v_case || '-' || substr(md5(random()::text),1,10);
    insert into public.atlas_research_queue
      (id,brand,perfume_name,manufacturer_url,source_notes,decision,status,reviewed_at,reviewed_by,review_note)
    values
      (v_id,'Atlas Gate Test','Gate '||v_id,'https://example.org/atlas-gate',
       '["Top: Vanilla"]'::jsonb,
       case when v_case='duplicate' then 'duplicate' else 'needs_source_review' end,
       case when v_case='pending' then 'pending' else 'approved' end,
       case when v_case='missing_review_time' then null else now() end,
       case when v_case='missing_reviewer' then null else 'integration-test' end,
       case when v_case='missing_review_note' then null else 'Approved test' end);
    begin
      perform public.import_approved_atlas_catalog_draft(v_id);
      raise exception 'Approval gate unexpectedly accepted %', v_case;
    exception when others then
      get stacked diagnostics v_error = message_text;
      if v_error <> 'Atlas research is not approved for import' then
        raise exception 'Unexpected error for %: %', v_case, v_error;
      end if;
    end;
    select count(*) into v_count from public.atlas_catalog_imports where research_id=v_id;
    if v_count <> 0 then raise exception 'Rejected case % wrote ledger', v_case; end if;
    select count(*) into v_count from public.perfumes where name='Gate '||v_id;
    if v_count <> 0 then raise exception 'Rejected case % wrote perfume', v_case; end if;
  end loop;
end
$test$;
rollback;
