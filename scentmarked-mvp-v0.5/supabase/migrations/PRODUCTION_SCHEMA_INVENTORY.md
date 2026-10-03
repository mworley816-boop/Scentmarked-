# Production schema inventory

Verified against the ScentMarked production Supabase project on 2026-10-03.

This document is a recovery/reproducibility reference. It does not replace executable migrations.

## Public tables

Production currently contains 21 tables in the `public` schema:

| Table | Key production columns |
| --- | --- |
| accords | id, name, slug |
| affiliate_clicks | id, offer_id, perfume_id, placement, clicked_at |
| brands | id, name, slug, country, website, description, logo_url, banner_url, social URLs, created_at |
| collection_items | user_id, perfume_id, status, created_at |
| comparison_votes | id, user_id, perfume_a_id, perfume_b_id, similarity, sweeter, stronger, longer, more_gourmand, created_at |
| contact_messages | id, created_at, name, email, category, subject, message, status, user_id |
| notes | id, name, slug, category, description, image_url |
| perfume_accords | perfume_id, accord_id, strength, source_type |
| perfume_affiliate_offers | id, perfume_id, merchant_name, affiliate_url, price, currency, label, is_active, priority, created_at, updated_at |
| perfume_image_provenance | perfume_id, source_name, source_url, rights_basis, rights_note, asset_url, checked_at, created_at, updated_at |
| perfume_notes | perfume_id, note_id, position |
| perfume_sources | id, perfume_id, source_name, source_url, source_type, fields_verified, checked_at, is_primary |
| perfumes | id, brand_id, name, slug, release_year, concentration, gender_marketing, description, image_url, country, price_low, price_high, status, created_at, updated_at |
| profiles | id, display_name, avatar_url, is_admin, created_at, scent_loved_notes, scent_avoided_notes, scent_sweetness, scent_projection, scent_longevity, scent_max_price, scent_occasions, scent_vibes, scent_presentations, scent_profile_completed_at, scent_favorite_perfume_ids |
| ratings | id, user_id, perfume_id, overall, longevity, projection, sweetness, review, created_at |
| recently_viewed_perfumes | user_id, perfume_id, viewed_at |
| recommendation_feedback | user_id, perfume_id, feedback, created_at, updated_at |
| recommendation_history | id, user_id, perfume_id, perfume_slug, loved_terms, avoided_terms, sweetness, projection, longevity, max_price, result_perfume_ids, created_at, criteria_key |
| saved_comparisons | user_id, perfume_a_id, perfume_b_id, created_at |
| scent_relationships | id, source_perfume_id, target_perfume_id, relationship_type, confidence, evidence_source, created_at |
| site_content | id, content_key, content_type, title, subtitle, body, image_url, mobile_image_url, alt_text, cta_label, cta_url, placement, sort_order, is_active, starts_at, ends_at, settings, created_at, updated_at |

## Auth provisioning dependency

Production has an `auth.users` trigger named `on_auth_user_created` that calls `public.handle_new_user()`. The function inserts the new Auth user ID and display name into `public.profiles`.

A recovered/fresh environment must preserve this behavior or authenticated users may reach onboarding without a profile row.

## Still required for a complete executable baseline

The recovery baseline must also capture and verify:

- exact column SQL types, defaults, generated/identity behavior, and nullability
- primary, unique, check, and foreign-key constraints
- indexes
- RLS enablement and policies
- public functions and triggers
- storage buckets and storage policies
- grants/permissions
- extensions or other schema dependencies required by migrations

See `README.md` in this directory for the verified production migration ledger and the current migration-history limitation.
