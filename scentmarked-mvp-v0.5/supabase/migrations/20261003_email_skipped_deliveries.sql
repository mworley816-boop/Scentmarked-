-- Give recipients who become ineligible after queueing a terminal delivery state.

alter table public.email_deliveries
  drop constraint if exists email_deliveries_status_check;

alter table public.email_deliveries
  add constraint email_deliveries_status_check
  check (status in ('queued','sent','delivered','opened','clicked','bounced','complained','failed','unsubscribed','skipped'));

alter table public.email_deliveries
  add column if not exists skipped_at timestamptz;
