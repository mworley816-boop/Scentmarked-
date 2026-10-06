import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

const csv=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"'
export async function GET(){
 const s=await createClient(),{data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 try{
  const service=createServiceClient(),{data}=await service.from('monetization_transactions').select('source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('revenue_type','affiliate').order('occurred_at',{ascending:false})
  const rows=(data||[]).filter((x:any)=>!x.affiliate_click_id||!x.affiliate_offer_id||!x.affiliate_merchant||!x.affiliate_placement||!x.perfume_id)
  const header=['source_name','external_id','gross','fees','currency','status','occurred_at','offer_id','click_id','merchant','placement','perfume_id']
  const body=[header.join(','),...rows.map((x:any)=>[x.source_name,x.external_id,(Number(x.gross_cents||0)/100).toFixed(2),(Number(x.fee_cents||0)/100).toFixed(2),x.currency,x.status,x.occurred_at,x.affiliate_offer_id,x.affiliate_click_id,x.affiliate_merchant,x.affiliate_placement,x.perfume_id].map(csv).join(','))].join('\n')
  return new Response(body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="scentmarked-affiliate-reconciliation.csv"','Cache-Control':'no-store'}})
 }catch{return new Response('Unable to export reconciliation data',{status:503})}
}
