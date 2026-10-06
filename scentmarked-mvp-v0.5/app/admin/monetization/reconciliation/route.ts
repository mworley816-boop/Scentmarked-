import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { reconcileAffiliateRow } from '@/lib/affiliate-reconciliation'
import { safeCsvCell,centsAmount } from '@/lib/financial-export'

export async function GET(){
 const s=await createClient(),{data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 try{
  const service=createServiceClient(),{data}=await service.from('monetization_transactions').select('source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('revenue_type','affiliate').order('occurred_at',{ascending:false})
  const all=data||[],clickIds=[...new Set(all.map((x:any)=>x.affiliate_click_id).filter(Boolean))],offerIds=[...new Set(all.map((x:any)=>x.affiliate_offer_id).filter(Boolean))]
  const {data:clicks}=clickIds.length?await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').in('id',clickIds):{data:[]}
  for(const click of clicks||[])if(click.offer_id)offerIds.push(click.offer_id)
  const {data:offers}=offerIds.length?await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').in('id',[...new Set(offerIds)]):{data:[]}
  const rows=all.map((row:any)=>({row,result:reconcileAffiliateRow(row,clicks||[],offers||[])})).filter(x=>x.result.state!=='complete')
  const header=['reconciliation_state','reconciliation_reasons','source_name','external_id','gross','fees','currency','status','occurred_at','offer_id','click_id','merchant','placement','perfume_id']
  const body=[header.join(','),...rows.map(({row:x,result}:any)=>[result.state,result.reasons.join('|'),x.source_name,x.external_id,centsAmount(Number(x.gross_cents||0)),centsAmount(Number(x.fee_cents||0)),x.currency,x.status,x.occurred_at,x.affiliate_offer_id,x.affiliate_click_id,x.affiliate_merchant,x.affiliate_placement,x.perfume_id].map(safeCsvCell).join(','))].join('\n')
  return new Response(body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="scentmarked-affiliate-reconciliation.csv"','Cache-Control':'no-store'}})
 }catch{return new Response('Unable to export reconciliation data',{status:503})}
}
