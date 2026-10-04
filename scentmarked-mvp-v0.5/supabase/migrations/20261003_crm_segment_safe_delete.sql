-- Safely delete only unused CRM segments.
create or replace function public.delete_unused_crm_segment(p_segment_id bigint)
returns boolean
language plpgsql
security invoker
set search_path=public
as $$
begin
  if exists(select 1 from public.email_campaigns where segment_id=p_segment_id) then
    raise exception 'Segment is used by an email campaign and cannot be deleted';
  end if;

  delete from public.crm_segments where id=p_segment_id;
  return found;
end;
$$;

revoke all on function public.delete_unused_crm_segment(bigint) from public;
grant execute on function public.delete_unused_crm_segment(bigint) to authenticated;
