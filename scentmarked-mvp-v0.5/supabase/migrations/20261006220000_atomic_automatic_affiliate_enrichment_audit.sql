create or replace function public.enrich_affiliate_attribution_with_audit(
 p_transaction_id bigint,p_offer_id bigint,p_merchant text,p_placement text,p_perfume_id text
) returns boolean
language plpgsql security invoker set search_path=''
as $$
declare v_before jsonb; v_after jsonb;
begin
 select jsonb_build_object('affiliate_offer_id',affiliate_offer_id,'affiliate_click_id',affiliate_click_id,'affiliate_merchant',affiliate_merchant,'affiliate_placement',affiliate_placement,'perfume_id',perfume_id)
 into v_before from public.monetization_transactions where id=p_transaction_id and revenue_type='affiliate' for update;
 if v_before is null then return false; end if;
 update public.monetization_transactions set affiliate_offer_id=coalesce(affiliate_offer_id,p_offer_id),affiliate_merchant=coalesce(affiliate_merchant,p_merchant),affiliate_placement=coalesce(affiliate_placement,p_placement),perfume_id=coalesce(perfume_id,p_perfume_id)
 where id=p_transaction_id and revenue_type='affiliate';
 select jsonb_build_object('affiliate_offer_id',affiliate_offer_id,'affiliate_click_id',affiliate_click_id,'affiliate_merchant',affiliate_merchant,'affiliate_placement',affiliate_placement,'perfume_id',perfume_id)
 into v_after from public.monetization_transactions where id=p_transaction_id;
 if v_after=v_before then return false; end if;
 insert into public.affiliate_attribution_audit(transaction_id,changed_by,change_source,before_values,after_values) values(p_transaction_id,null,'automatic',v_before,v_after);
 return true;
end; $$;
revoke execute on function public.enrich_affiliate_attribution_with_audit(bigint,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.enrich_affiliate_attribution_with_audit(bigint,bigint,text,text,text) to service_role;
