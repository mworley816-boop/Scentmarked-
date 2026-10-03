# Production public-schema RLS policies

Verified directly from `pg_policies` in production on 2026-10-03. Recovery reference only.

All observed policies are PERMISSIVE.

## User-owned data

- collection_items — authenticated ALL; USING/WITH CHECK: `(select auth.uid()) = user_id`.
- profiles — public SELECT only where `(select auth.uid()) = id`; authenticated UPDATE with the same USING and WITH CHECK.
- ratings — public SELECT true; authenticated INSERT/UPDATE/DELETE restricted to `auth.uid() = user_id`.
- comparison_votes — public SELECT true; authenticated INSERT/UPDATE/DELETE restricted to `auth.uid() = user_id`.
- recently_viewed_perfumes — authenticated SELECT/INSERT/UPDATE/DELETE restricted to `auth.uid() = user_id`.
- recommendation_feedback — authenticated SELECT/INSERT/UPDATE/DELETE restricted to `auth.uid() = user_id`.
- recommendation_history — authenticated SELECT/INSERT/UPDATE/DELETE restricted to `auth.uid() = user_id`.
- saved_comparisons — authenticated SELECT/INSERT/DELETE restricted to `auth.uid() = user_id`.

## Catalog/admin pattern

For accords, brands, notes, perfume_accords, perfume_image_provenance, perfume_notes, perfume_sources, and scent_relationships:
- public/catalog SELECT policies allow reads.
- authenticated INSERT/UPDATE/DELETE policies require an existing `profiles` row for `auth.uid()` with `is_admin = true`.
- UPDATE policies apply the admin test to both USING and WITH CHECK.

## Perfumes

- anon SELECT: `status = 'published'`.
- authenticated SELECT: published rows OR current user is an admin.
- authenticated INSERT/UPDATE/DELETE: current user must have `profiles.is_admin = true`.

This is the database-level protection that prevents draft fragrances from being exposed to normal public/authenticated users.

## Affiliate offers

- anon SELECT: active offers only.
- authenticated SELECT: active offers OR current user is admin.
- authenticated INSERT/UPDATE/DELETE: admin only.

## Affiliate clicks

- anon/authenticated INSERT only when placement is `profile_featured` or `profile_more` and the referenced offer exists, matches the perfume, and is active.
- authenticated SELECT: admin only.

## Contact messages

- anon/authenticated INSERT: `user_id is null OR user_id = auth.uid()`.
- authenticated SELECT/UPDATE: admin only.

## Site content

- anon/authenticated SELECT: true.
- authenticated INSERT/UPDATE/DELETE: admin only.

## Exact-expression notes

The production policies consistently use scalar subqueries such as `(select auth.uid())` and admin checks of the form:

```sql
exists (
  select 1
  from profiles p
  where p.id = (select auth.uid())
    and p.is_admin = true
)
```

When generating executable baseline SQL, preserve the effective roles, commands, USING expressions, and WITH CHECK expressions recorded here. Policy names were also verified in production and should be retained where practical.

Storage-object policies are not included in this file and remain a separate recovery item.
