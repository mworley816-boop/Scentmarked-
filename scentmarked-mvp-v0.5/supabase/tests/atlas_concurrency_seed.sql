-- Two sessions are launched by the CI script. The same approved research ID must map to one perfume.
insert into public.atlas_research_queue
(id,brand,perfume_name,manufacturer_url,source_notes,decision,status,reviewed_at,reviewed_by,review_note)
values ('atlas-concurrency-ci','Atlas Concurrency','Concurrency CI','https://example.org/concurrent','["Top: Vanilla"]'::jsonb,'needs_source_review','approved',now(),'integration-test','Approved concurrency test');
