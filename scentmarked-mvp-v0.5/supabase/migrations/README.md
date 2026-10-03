# ScentMarked Supabase migrations

This directory is **not yet a complete database bootstrap history**.

The production Supabase project contains earlier migrations and schema objects that predate the SQL files currently checked into this repository. In particular, production includes the core catalog/member schema, RLS policies, indexes, storage policies, affiliate/recommendation/contact tables, and the Auth-user profile provisioning trigger/function.

The SQL files in this directory currently document only the newer changes that were added to source control:

- `20261003_scent_profile_questionnaire.sql`
- `20261003_remove_duplicate_profiles_auth_user_fkey.sql`

Do not initialize a new ScentMarked Supabase project by running only this directory; it will be incomplete.

Before using repository migrations as a disaster-recovery or fresh-environment bootstrap, export/reconstruct the production migration baseline, review it for secrets and environment-specific data, and commit the verified schema history in migration order.

Production currently provisions `public.profiles` for new Auth users with an `auth.users` trigger named `on_auth_user_created` calling `public.handle_new_user()`. Preserve that behavior when the baseline is captured.

## Production migration ledger

Verified against the production Supabase migration ledger on 2026-10-03. Production currently reports 29 applied migrations:

```text
20260919003134 initial_scentmarked_schema
20260919003144 security_and_indexes
20260928081244 admin_perfume_image_storage_policies
20260928083415 perfume_image_provenance
20260928091209 admin_scent_relationship_policies
20260928110521 ratings_profile_relationship
20260928184633 add_scent_profile_preferences
20260928191500 add_perfume_affiliate_offers
20260928192236 allow_admin_affiliate_offer_writes
20260928204019 allow_admin_read_all_affiliate_offers
20260928221131 add_affiliate_click_tracking
20260929120440 add_recently_viewed_perfumes
20260929144538 add_saved_comparisons
20260929150543 add_recommendation_history
20260929160246 deduplicate_recommendation_history
20260929161932 enforce_saved_comparison_pair_order
20260930054031 add_site_content_management
20260930054750 add_site_media_bucket
20260930070547 add_brand_visual_fields
20260930175344 add_contact_messages
20260930180227 optimize_contact_messages_rls
20260930180506 index_remaining_foreign_keys
20260930181153 consolidate_catalog_select_policies
20260930182830 add_member_data_delete_rules
20260930185250 cascade_profile_from_auth_user
20261003101759 add_scent_profile_occasions_and_vibes
20261003102007 add_scent_profile_style_and_completion
20261003104007 add_scent_profile_favorite_perfumes
20261003171240 remove_duplicate_profiles_auth_user_fkey
```

The repository's consolidated questionnaire migration covers the three production questionnaire migrations conceptually, but its filename/version is not the production migration ledger version. Do not mark the baseline complete until the earlier production DDL has been captured and the checked-in migration strategy has been reconciled with this ledger.
