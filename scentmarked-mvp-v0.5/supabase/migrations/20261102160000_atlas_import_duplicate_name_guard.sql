-- Correct the duplicate guard in the previous migration; safe to apply independently.
-- One transaction for an approved Atlas research record -> unpublished catalog draft.
-- SECURITY INVOKER: only a privileged, independently admin-authorized server
-- connection with table privileges can execute this function.
create or replace function public.import_approved_atlas_catalog_draft(
 p_research_id text,
 p_description text default null,
 p_concentration text default null,
 p_release_year integer default null,
 p_country text default null
) returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
 v_research public.atlas_research_queue%rowtype;
 v_existing uuid;
 v_brand_id uuid;
 v_perfume_id uuid;
 v_brand_slug text;
 v_perfume_slug text;
 v_note_slug text;
 v_note_id uuid;
 v_note_name text;
 v_position text;
 v_entry text;
 v_match text[];
 v_ordinal integer := 1;
 v_seen text[] := array[]::text[];
begin
 if p_research_id is null or length(p_research_id) not between 1 and 160 then
  raise exception 'Invalid Atlas research ID';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('atlas-catalog:'||p_research_id,0));
 select * into v_research from public.atlas_research_queue where id=p_research_id for update;
 if not found or v_research.status <> 'approved' or v_research.reviewed_by is null
  or pg_catalog.btrim(v_research.reviewed_by)='' or v_research.reviewed_at is null
  or v_research.review_note is null or pg_catalog.btrim(v_research.review_note)=''
  or v_research.decision='duplicate' then
  raise exception 'Atlas research is not approved for import';
 end if;
 -- A retry must still have valid approval. Do not return a previously
 -- imported draft when its Atlas research approval has been revoked.
 select perfume_id into v_existing from public.atlas_catalog_imports where research_id=p_research_id;
 if v_existing is not null then return v_existing; end if;
 if pg_catalog.jsonb_typeof(v_research.source_notes) is distinct from 'array' then
  raise exception 'Invalid Atlas research notes';
 end if;
 if pg_catalog.jsonb_array_length(v_research.source_notes) not between 1 and 100 then
  raise exception 'Invalid Atlas research notes';
 end if;
 if v_research.manufacturer_url !~ '^https://[^[:space:]]+$'
  or v_research.manufacturer_url ~ '^https://[^/]*@'
  or v_research.manufacturer_url ~ '^https://[^/]*:[0-9]+(/|$)' then
  raise exception 'Invalid manufacturer source URL';
 end if;
 v_brand_slug := pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(v_research.brand),'[^a-z0-9]+','-','g'),'-');
 v_perfume_slug := pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(v_research.brand||' '||v_research.perfume_name),'[^a-z0-9]+','-','g'),'-');
 if v_brand_slug='' or v_perfume_slug='' then raise exception 'Invalid fragrance identity'; end if;
 insert into public.brands(name,slug) values(v_research.brand,v_brand_slug)
 on conflict (slug) do nothing;
 select id into v_brand_id from public.brands where slug=v_brand_slug;
 if exists(select 1 from public.perfumes where brand_id=v_brand_id and (case when pg_catalog.right(pg_catalog.regexp_replace(pg_catalog.lower(name),'[^a-z0-9]+','','g'),1)='s' then pg_catalog.left(pg_catalog.regexp_replace(pg_catalog.lower(name),'[^a-z0-9]+','','g'),pg_catalog.length(pg_catalog.regexp_replace(pg_catalog.lower(name),'[^a-z0-9]+','','g'))-1) else pg_catalog.regexp_replace(pg_catalog.lower(name),'[^a-z0-9]+','','g') end = case when pg_catalog.right(pg_catalog.regexp_replace(pg_catalog.lower(v_research.perfume_name),'[^a-z0-9]+','','g'),1)='s' then pg_catalog.left(pg_catalog.regexp_replace(pg_catalog.lower(v_research.perfume_name),'[^a-z0-9]+','','g'),pg_catalog.length(pg_catalog.regexp_replace(pg_catalog.lower(v_research.perfume_name),'[^a-z0-9]+','','g'))-1) else pg_catalog.regexp_replace(pg_catalog.lower(v_research.perfume_name),'[^a-z0-9]+','','g') end)) then
  raise exception 'Fragrance already exists in catalog';
 end if;
 while exists(select 1 from public.perfumes where slug=v_perfume_slug) loop
  v_ordinal:=v_ordinal+1;
  v_perfume_slug:=pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(v_research.brand||' '||v_research.perfume_name),'[^a-z0-9]+','-','g'),'-')||'-'||v_ordinal::text;
 end loop;
 insert into public.perfumes(brand_id,name,slug,status,description,concentration,release_year,country)
 values(v_brand_id,v_research.perfume_name,v_perfume_slug,'draft',p_description,p_concentration,p_release_year,p_country)
 returning id into v_perfume_id;
 for v_entry in select value from pg_catalog.jsonb_array_elements_text(v_research.source_notes) as t(value) loop
  v_match:=pg_catalog.regexp_match(v_entry,'^(Top|Heart|Base):[[:space:]]*(.+)$','i');
  if v_match is null then raise exception 'Unsupported Atlas note label'; end if;
  v_position:=pg_catalog.lower(v_match[1]);
  v_note_name:=pg_catalog.btrim(v_match[2]);
  if length(v_note_name) not between 1 and 120 or v_note_name !~* '[a-z0-9]' then
   raise exception 'Invalid Atlas note name';
  end if;
  if v_position||'|'||pg_catalog.lower(v_note_name)=any(v_seen) then continue; end if;
  v_seen:=pg_catalog.array_append(v_seen,v_position||'|'||pg_catalog.lower(v_note_name));
  v_note_slug:=pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(v_note_name),'[^a-z0-9]+','-','g'),'-');
  if v_note_slug='' then raise exception 'Invalid Atlas note slug'; end if;
  insert into public.notes(name,slug) values(v_note_name,v_note_slug) on conflict (slug) do nothing;
  select id into v_note_id from public.notes where slug=v_note_slug;
  insert into public.perfume_notes(perfume_id,note_id,position)
  values(v_perfume_id,v_note_id,v_position) on conflict do nothing;
 end loop;
 insert into public.perfume_sources(perfume_id,source_name,source_url,source_type,fields_verified,is_primary,checked_at)
 values(v_perfume_id,'Atlas approved manufacturer research',v_research.manufacturer_url,'official',array[]::text[],false,pg_catalog.now());
 insert into public.atlas_catalog_imports(research_id,perfume_id) values(p_research_id,v_perfume_id);
 return v_perfume_id;
end;
$$;
revoke all on function public.import_approved_atlas_catalog_draft(text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.import_approved_atlas_catalog_draft(text,text,text,integer,text) to service_role;
