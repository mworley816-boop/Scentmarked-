-- ScentMarked production recovery baseline: standalone indexes
-- Verified from pg_indexes on 2026-10-03.
-- Apply after 001_public_schema.sql.
-- Primary-key and UNIQUE-constraint indexes are intentionally omitted because
-- PostgreSQL creates them from constraints in 001_public_schema.sql.

create index affiliate_clicks_clicked_at_idx
  on public.affiliate_clicks using btree (clicked_at desc);
create index affiliate_clicks_offer_id_idx
  on public.affiliate_clicks using btree (offer_id);
create index affiliate_clicks_perfume_id_idx
  on public.affiliate_clicks using btree (perfume_id);

create index collection_perfume_idx
  on public.collection_items using btree (perfume_id);

create index votes_a_idx
  on public.comparison_votes using btree (perfume_a_id);
create index votes_b_idx
  on public.comparison_votes using btree (perfume_b_id);
create index votes_gourmand_idx
  on public.comparison_votes using btree (more_gourmand);
create index votes_longer_idx
  on public.comparison_votes using btree (longer);
create index votes_stronger_idx
  on public.comparison_votes using btree (stronger);
create index votes_sweeter_idx
  on public.comparison_votes using btree (sweeter);

create index contact_messages_user_id_idx
  on public.contact_messages using btree (user_id);

create index perfume_accords_accord_idx
  on public.perfume_accords using btree (accord_id);

create index perfume_affiliate_offers_perfume_id_idx
  on public.perfume_affiliate_offers using btree (perfume_id);

create index perfume_notes_note_idx
  on public.perfume_notes using btree (note_id);

create index perfumes_brand_idx
  on public.perfumes using btree (brand_id);

create index ratings_perfume_idx
  on public.ratings using btree (perfume_id);

create index recently_viewed_perfumes_perfume_id_idx
  on public.recently_viewed_perfumes using btree (perfume_id);

create index recommendation_feedback_perfume_id_idx
  on public.recommendation_feedback using btree (perfume_id);

create index recommendation_history_perfume_id_idx
  on public.recommendation_history using btree (perfume_id);
create index recommendation_history_user_created_idx
  on public.recommendation_history using btree (user_id, created_at desc);

create index saved_comparisons_perfume_a_id_idx
  on public.saved_comparisons using btree (perfume_a_id);
create index saved_comparisons_perfume_b_id_idx
  on public.saved_comparisons using btree (perfume_b_id);

create index relationships_target_idx
  on public.scent_relationships using btree (target_perfume_id);
