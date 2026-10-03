# Production constraints and indexes

Verified against the ScentMarked production Supabase project on 2026-10-03.

This is a recovery reference, not an executable migration. Constraint-backed indexes are listed conceptually with their constraints; the important standalone indexes are called out separately.

## Catalog integrity

- `accords`: PK `id`; unique `name`; unique `slug`.
- `brands`: PK `id`; unique `name`; unique `slug`.
- `notes`: PK `id`; unique `name`; unique `slug`.
- `perfumes`: PK `id`; unique `slug`; FK `brand_id -> brands.id ON DELETE SET NULL`; status limited to `draft|published`.
- `perfume_notes`: composite PK `(perfume_id,note_id,position)`; perfume/note FKs cascade; position limited to `top|heart|base|unspecified`.
- `perfume_accords`: composite PK `(perfume_id,accord_id,source_type)`; FKs cascade; strength 0–100; source type limited to `editorial|manufacturer|community`.
- `perfume_sources`: PK `id`; unique `(perfume_id,source_url)`; perfume FK cascades.
- `perfume_image_provenance`: PK/FK `perfume_id` cascading to perfumes; documented rights-basis check.
- `scent_relationships`: PK `id`; source/target perfume FKs cascade; unique source/target/type; confidence 0–100; relationship type limited to manufacturer_inspired_by, community_comparison, similar_dna, possible_clone, flanker.

## Member-data integrity

- `profiles`: PK `id`; FK to `auth.users(id) ON DELETE CASCADE`; scent sweetness/projection/longevity each nullable 1–5; max price nullable >= 0.
- `collection_items`: PK `(user_id,perfume_id,status)`; user FKs to both Auth and profiles cascade; perfume FK cascades; status limited to owned/want/tried/favorite.
- `ratings`: PK `id`; unique `(user_id,perfume_id)`; user FKs to Auth/profile cascade; perfume FK cascades; rating dimensions constrained 1–5.
- `recently_viewed_perfumes`: PK `(user_id,perfume_id)`; user Auth/profile and perfume FKs cascade.
- `recommendation_feedback`: PK `(user_id,perfume_id)`; user Auth/profile and perfume FKs cascade; feedback limited to more_like_this/less_like_this.
- `recommendation_history`: PK `id`; unique `(user_id,criteria_key)`; user Auth/profile FKs cascade; optional perfume FK sets null; preference ranges/checks enforced.
- `saved_comparisons`: PK `(user_id,perfume_a_id,perfume_b_id)`; user Auth/profile and perfume FKs cascade; perfumes must differ; canonical UUID-text ordering enforced.
- `comparison_votes`: PK `id`; unique `(user_id,perfume_a_id,perfume_b_id)`; Auth user FK cascades while profile FK sets null; pair perfume FKs cascade; winner-dimension perfume FKs exist; similarity 1–5.
- `contact_messages`: PK `id`; Auth/profile user FKs set null; category/status and field-length checks enforced.

## Affiliate/content integrity

- `perfume_affiliate_offers`: PK `id`; perfume FK cascades; price nullable >= 0; URL must start with http/https.
- `affiliate_clicks`: PK `id`; offer and perfume FKs cascade.
- `site_content`: PK `id`; unique `content_key`; content type limited to section/banner/background/hero/global.

## Standalone production indexes

- perfumes: `perfumes_brand_idx (brand_id)`
- perfume_notes: `perfume_notes_note_idx (note_id)`
- perfume_accords: `perfume_accords_accord_idx (accord_id)`
- collection_items: `collection_perfume_idx (perfume_id)`
- ratings: `ratings_perfume_idx (perfume_id)`
- comparison_votes: `votes_a_idx`, `votes_b_idx`, `votes_sweeter_idx`, `votes_stronger_idx`, `votes_longer_idx`, `votes_gourmand_idx`
- scent_relationships: `relationships_target_idx (target_perfume_id)`
- perfume_affiliate_offers: `perfume_affiliate_offers_perfume_id_idx (perfume_id)`
- affiliate_clicks: `affiliate_clicks_clicked_at_idx (clicked_at DESC)`, `affiliate_clicks_offer_id_idx (offer_id)`, `affiliate_clicks_perfume_id_idx (perfume_id)`
- contact_messages: `contact_messages_user_id_idx (user_id)`
- recently_viewed_perfumes: `recently_viewed_perfumes_perfume_id_idx (perfume_id)`
- recommendation_feedback: `recommendation_feedback_perfume_id_idx (perfume_id)`
- recommendation_history: `recommendation_history_perfume_id_idx (perfume_id)`, `recommendation_history_user_created_idx (user_id,created_at DESC)`
- saved_comparisons: `saved_comparisons_perfume_a_id_idx (perfume_a_id)`, `saved_comparisons_perfume_b_id_idx (perfume_b_id)`

Constraint-created PK/unique indexes must also be preserved by the executable baseline.

## Next recovery layers

Still to capture from production: exact column defaults/identity definitions, RLS policies, public functions/triggers, storage buckets/policies, grants, and required extensions.
