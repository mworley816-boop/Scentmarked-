import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { enrichAffiliateRows } from '@/lib/affiliate-enrichment'
import { redirect } from 'next/navigation'

export async function POST(){
 const s=await createClient(),{data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 try{
  const service=createServiceClient(),{data:tx}=await service.from('monetization_transactions').select('id,source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('revenue_type','affiliate').or('affiliate_click_id.not.is.null,affiliate_offer_id.not.is.null')
  const incomplete=(tx||[]).filter((x:any)=>!x.affiliate_merchant||!x.affiliate_placement||!x.perfume_id||!x.affiliate_offer_id),clickIds=[...new Set(incomplete.map((x:any)=>x.affiliate_click_id).filter(Boolean))],offerIds=[...new Set(incomplete.map((x:any)=>x.affiliate_offer_id).filter(Boolean))]
  const {data:clicks}=clickIds.length?await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').in('id',clickIds):{data:[]};for(const x of clicks||[])if(x.offer_id)offerIds.push(x.offer_id)
  const {data:offers}=offerIds.length?await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').in('id',[...new Set(offerIds)]):{data:[]}
  const enriched=enrichAffiliateRows(incomplete as any,clicks||[],offers||[]);let updated=0
  for(let i=0;i<incomplete.length;i++){const before:any=incomplete[i],after:any=enriched[i],patch:any={};for(const k of ['affiliate_offer_id','affiliate_merchant','affiliate_placement','perfume_id'])if(!before[k]&&after[k])patch[k]=after[k];if(Object.keys(patch).length){const {error}=await service.from('monetization_transactions').update(patch).eq('id',before.id);if(!error)updated++}}
  redirect('/admin/monetization?message='+encodeURIComponent(updated+' commission records enriched from exact tracking data'))
 }catch{redirect('/admin/monetization?error=Automatic+attribution+could+not+run')}
}
