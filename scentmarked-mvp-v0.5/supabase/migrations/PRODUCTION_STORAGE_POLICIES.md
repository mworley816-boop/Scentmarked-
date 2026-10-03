# Production storage object policies

Verified directly from `pg_policies` for `storage.objects` in production on 2026-10-03.

This is a recovery reference, not an executable migration. All observed policies are PERMISSIVE.

## perfume-images

Bucket mutations are restricted to authenticated users whose `public.profiles` row has `is_admin = true`.

### admins_insert_perfume_images
- Role: authenticated
- Command: INSERT
- WITH CHECK:
```sql
bucket_id = 'perfume-images'
and exists (
  select 1
  from profiles p
  where p.id = auth.uid()
    and p.is_admin = true
)
```

### admins_update_perfume_images
- Role: authenticated
- Command: UPDATE
- USING and WITH CHECK use the same bucket/admin expression above.

### admins_delete_perfume_images
- Role: authenticated
- Command: DELETE
- USING uses the same bucket/admin expression above.

No `perfume-images` object SELECT policy matching this bucket was returned by the production policy query. The bucket itself is configured public, as recorded in `PRODUCTION_STORAGE.md`. Preserve this distinction rather than inventing a SELECT policy.

## site-media

All recovered policies require `bucket_id = 'site-media'` and an authenticated current user with `profiles.is_admin = true`. These production expressions use `(select auth.uid())` inside the admin lookup.

### Admins can upload site media
- Role: authenticated
- Command: INSERT
- WITH CHECK: site-media bucket + current user is admin.

### Admins can update site media
- Role: authenticated
- Command: UPDATE
- USING: site-media bucket + current user is admin.
- WITH CHECK: same expression.

### Admins can delete site media
- Role: authenticated
- Command: DELETE
- USING: site-media bucket + current user is admin.

### Admins can view site media objects
- Role: authenticated
- Command: SELECT
- USING: site-media bucket + current user is admin.

The `site-media` bucket is also configured as public. Public bucket delivery and SQL-level `storage.objects` row access are separate mechanisms; do not remove the explicit admin SELECT policy solely because the bucket is public.

## Recovery status

The application-specific storage policy gap is now captured for both ScentMarked buckets. A future executable baseline should recreate these policies after the `profiles` table and buckets exist, preserving the production policy names and expressions where practical.
