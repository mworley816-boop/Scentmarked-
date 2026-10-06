create or replace function public.update_affiliate_attribution_with_audit(
 p_transaction_id bigint,p_offer_id bigint,p_click_id bigint,p_merchant text,p_placement text,p_perfume_id text,p_changed_by uuid
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare v_before jsonb; v_after jsonb;
begin
 select jsonb_build_object(
  'affiliate_offer_id',affiliate_offer_id,'affiliate_click_id',affiliate_click_id,'affiliate_merchant',affiliate_merchant,'affiliate_placement',affiliate_placement,'perfume_id',perfume_id
 ) into v_before
 from public.monetization_transactions
 where id=p_transaction_id and revenue_type='affiliate'
 for update;
 if v_before is null then return false; end if;
 update public.monetization_transactions set affiliate_offer_id=p_offer_id,affiliate_click_id=p_click_id,affiliate_merchant=p_merchant,affiliate_placement=p_placement,perfume_id=p_perfume_id
 where id=p_transaction_id and revenue_type='affiliate';
 v_after=jsonb_build_object('affiliate_offer_id',p_offer_id,'affiliate_click_id',p_click_id,'affiliate_merchant',p_merchant,'affiliate_placement',p_placement,'perfume_id',p_perfume_id);
 insert into public.affiliate_attribution_audit(transaction_id,changed_by,change_source,before_values,after_values)
 values(p_transaction_id,p_changed_by,'manual',v_before,v_after);
 return true;
end;
$$;
revoke execute on function public.update_affiliate_attribution_with_audit(bigint,bigint,bigint,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.update_affiliate_attribution_with_audit(bigint,bigint,bigint,text,text,text,uuid) to service_role;
