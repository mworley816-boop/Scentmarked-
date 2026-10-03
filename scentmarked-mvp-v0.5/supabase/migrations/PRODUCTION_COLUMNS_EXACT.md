# Production exact column inventory

Verified directly from `information_schema.columns` in production on 2026-10-03. This file records exact column order, PostgreSQL-facing type, and nullability for all 21 public tables. Defaults/identity behavior are in `PRODUCTION_DEFAULTS_IDENTITIES.md`; constraints are in `PRODUCTION_CONSTRAINTS_INDEXES.md`.

## accords
- id uuid NOT NULL
- name text NOT NULL
- slug text NOT NULL

## affiliate_clicks
- id bigint NOT NULL
- offer_id bigint NOT NULL
- perfume_id uuid NOT NULL
- placement text NOT NULL
- clicked_at timestamptz NOT NULL

## brands
- id uuid NOT NULL
- name text NOT NULL
- slug text NOT NULL
- country text NULL
- website text NULL
- description text NULL
- logo_url text NULL
- created_at timestamptz NULL
- banner_url text NULL
- instagram_url text NULL
- facebook_url text NULL
- tiktok_url text NULL

## collection_items
- user_id uuid NOT NULL
- perfume_id uuid NOT NULL
- status text NOT NULL
- created_at timestamptz NULL

## comparison_votes
- id uuid NOT NULL
- user_id uuid NULL
- perfume_a_id uuid NULL
- perfume_b_id uuid NULL
- similarity integer NULL
- sweeter uuid NULL
- stronger uuid NULL
- longer uuid NULL
- more_gourmand uuid NULL
- created_at timestamptz NULL

## contact_messages
- id bigint NOT NULL
- created_at timestamptz NOT NULL
- name text NOT NULL
- email text NOT NULL
- category text NOT NULL
- subject text NOT NULL
- message text NOT NULL
- status text NOT NULL
- user_id uuid NULL

## notes
- id uuid NOT NULL
- name text NOT NULL
- slug text NOT NULL
- category text NULL
- description text NULL
- image_url text NULL

## perfume_accords
- perfume_id uuid NOT NULL
- accord_id uuid NOT NULL
- strength integer NULL
- source_type text NOT NULL

## perfume_affiliate_offers
- id bigint NOT NULL
- perfume_id uuid NOT NULL
- merchant_name text NOT NULL
- affiliate_url text NOT NULL
- price numeric NULL
- currency text NOT NULL
- label text NULL
- is_active boolean NOT NULL
- priority integer NOT NULL
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

## perfume_image_provenance
- perfume_id uuid NOT NULL
- source_name text NOT NULL
- source_url text NULL
- rights_basis text NOT NULL
- rights_note text NULL
- asset_url text NOT NULL
- checked_at timestamptz NOT NULL
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

## perfume_notes
- perfume_id uuid NOT NULL
- note_id uuid NOT NULL
- position text NOT NULL

## perfume_sources
- id bigint NOT NULL
- perfume_id uuid NOT NULL
- source_name text NOT NULL
- source_url text NOT NULL
- source_type text NOT NULL
- fields_verified text[] NOT NULL
- checked_at timestamptz NOT NULL
- is_primary boolean NOT NULL

## perfumes
- id uuid NOT NULL
- brand_id uuid NULL
- name text NOT NULL
- slug text NOT NULL
- release_year integer NULL
- concentration text NULL
- gender_marketing text NULL
- description text NULL
- image_url text NULL
- country text NULL
- price_low numeric NULL
- price_high numeric NULL
- status text NOT NULL
- created_at timestamptz NULL
- updated_at timestamptz NULL

## profiles
- id uuid NOT NULL
- display_name text NULL
- avatar_url text NULL
- is_admin boolean NOT NULL
- created_at timestamptz NULL
- scent_loved_notes text[] NOT NULL
- scent_avoided_notes text[] NOT NULL
- scent_sweetness smallint NULL
- scent_projection smallint NULL
- scent_longevity smallint NULL
- scent_max_price numeric NULL
- scent_occasions text[] NULL
- scent_vibes text[] NULL
- scent_presentations text[] NULL
- scent_profile_completed_at timestamptz NULL
- scent_favorite_perfume_ids uuid[] NULL

## ratings
- id uuid NOT NULL
- user_id uuid NULL
- perfume_id uuid NULL
- overall integer NULL
- longevity integer NULL
- projection integer NULL
- sweetness integer NULL
- review text NULL
- created_at timestamptz NULL

## recently_viewed_perfumes
- user_id uuid NOT NULL
- perfume_id uuid NOT NULL
- viewed_at timestamptz NOT NULL

## recommendation_feedback
- user_id uuid NOT NULL
- perfume_id uuid NOT NULL
- feedback text NOT NULL
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

## recommendation_history
- id bigint NOT NULL
- user_id uuid NOT NULL
- perfume_id uuid NULL
- perfume_slug text NULL
- loved_terms text[] NOT NULL
- avoided_terms text[] NOT NULL
- sweetness smallint NULL
- projection smallint NULL
- longevity smallint NULL
- max_price numeric NULL
- result_perfume_ids uuid[] NOT NULL
- created_at timestamptz NOT NULL
- criteria_key text NOT NULL

## saved_comparisons
- user_id uuid NOT NULL
- perfume_a_id uuid NOT NULL
- perfume_b_id uuid NOT NULL
- created_at timestamptz NOT NULL

## scent_relationships
- id uuid NOT NULL
- source_perfume_id uuid NULL
- target_perfume_id uuid NULL
- relationship_type text NOT NULL
- confidence numeric NULL
- evidence_source text NULL
- created_at timestamptz NULL

## site_content
- id bigint NOT NULL
- content_key text NOT NULL
- content_type text NOT NULL
- title text NULL
- subtitle text NULL
- body text NULL
- image_url text NULL
- mobile_image_url text NULL
- alt_text text NULL
- cta_label text NULL
- cta_url text NULL
- placement text NULL
- sort_order integer NOT NULL
- is_active boolean NOT NULL
- starts_at timestamptz NULL
- ends_at timestamptz NULL
- settings jsonb NOT NULL
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

## Baseline use

This inventory plus the verified defaults/identities, constraints/indexes, RLS policies, functions/triggers, storage configuration/policies, and grants/extensions documents is the source set for constructing the executable recovery baseline. Do not infer additional columns from application TypeScript types.
