-- Atomic replacement of a manual premium subscription.
create or replace function public.replace_manual_membership(p_user_id uuid,p_plan_id bigint,p_days integer)
returns bigint language plpgsql security invoker set search_path = ''
as $$
declare v_id bigint;
begin
 if p_user_id is null or p_plan_id is null or p_days is null or p_days < 1 or p_days > 3660 then
  raise exception 'Invalid membership grant';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
 if not exists (select 1 from public.membership_plans where id=p_plan_id and is_active=true and slug <> 'free') then
  raise exception 'Premium plan not available';
 end if;
 update public.member_subscriptions set status='expired',updated_at=now()
 where user_id=p_user_id and provider='manual' and status in ('trialing','active','past_due','cancelled');
 insert into public.member_subscriptions(user_id,plan_id,provider,status,current_period_start,current_period_end,cancel_at_period_end)
 values(p_user_id,p_plan_id,'manual','active',now(),now()+(p_days * interval '1 day'),false)
 returning id into v_id;
 return v_id;
end;
$$;
revoke all on function public.replace_manual_membership(uuid,bigint,integer) from public,anon,authenticated;
grant execute on function public.replace_manual_membership(uuid,bigint,integer) to service_role;
