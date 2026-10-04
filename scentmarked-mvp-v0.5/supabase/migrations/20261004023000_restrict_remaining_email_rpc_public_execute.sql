revoke execute on function public.claim_email_delivery_batch(uuid,integer) from public,anon;
revoke execute on function public.release_email_delivery_claims(uuid[]) from public,anon;
revoke execute on function public.preview_email_segment_audience(bigint,integer) from public,anon;

grant execute on function public.claim_email_delivery_batch(uuid,integer) to authenticated,service_role;
grant execute on function public.release_email_delivery_claims(uuid[]) to authenticated,service_role;
grant execute on function public.preview_email_segment_audience(bigint,integer) to authenticated,service_role;
