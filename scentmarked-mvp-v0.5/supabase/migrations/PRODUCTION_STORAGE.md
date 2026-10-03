# Production storage configuration

Verified against the ScentMarked production Supabase project on 2026-10-03.

This is a recovery reference, not an executable migration.

## Buckets

Production currently has two application storage buckets.

### perfume-images

- Bucket ID/name: `perfume-images`
- Public: yes
- File-size limit: 5,242,880 bytes (5 MiB)
- Allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/avif`

### site-media

- Bucket ID/name: `site-media`
- Public: yes
- File-size limit: 5,242,880 bytes (5 MiB)
- Allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/avif`

## Recovery requirements

A fresh ScentMarked environment must recreate both buckets with the same public visibility, file-size limit, and MIME allow-list before the Admin Media Library and fragrance-image upload workflows can be considered restored.

The production migration ledger indicates storage-policy work in migrations such as `admin_perfume_image_storage_policies` and `add_site_media_bucket`. Exact `storage.objects` policy expressions have not yet been captured in this repository and must not be inferred from bucket visibility alone. Public buckets control asset reads; upload/update/delete authorization still depends on storage policies.
