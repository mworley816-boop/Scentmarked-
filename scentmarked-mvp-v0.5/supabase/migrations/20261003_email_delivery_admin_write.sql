-- Allow authenticated ScentMarked admins to manage delivery rows used by
-- audience preparation and the protected campaign sender.

drop policy if exists "admins_manage_email_deliveries" on public.email_deliveries;
create policy "admins_manage_email_deliveries" on public.email_deliveries
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
);
