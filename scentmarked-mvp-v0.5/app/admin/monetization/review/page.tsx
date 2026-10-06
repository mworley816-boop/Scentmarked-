import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { reconcileAffiliateRow } from '@/lib/affiliate-reconciliation'
import { money } from '@/lib/monetization'
import { bulkEnrichAffiliateAttribution, updateAffiliateAttribution } from '../actions'

export const metadata={title:'Affiliate Reconciliation | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function AffiliateReconciliationPage({searchParams}:{searchParams:Promise<{error?:string;message?:string;state?:string}>}){
 const params=await searchParams,s=await createClient(),{data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization/review')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 const service=createServiceClient()
 const {data:transactions}=await service.from('monetization_transactions').select('id,source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('revenue_type','affiliate').order('occurred_at',{ascending:false}).limit(1000)
 const rows=(transactions||[]).filter((x:any)=>!x.affiliate_click_id||!x.affiliate_offer_id||!x.affiliate_merchant||!x.affiliate_placement||!x.perfume_id)
 const clickIds=[...new Set(rows.map((x:any)=>x.affiliate_click_id).filter(Boolean))],offerIds=[...new Set(rows.map((x:any)=>x.affiliate_offer_id).filter(Boolean))]
 const {data:clicks}=clickIds.length?await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').in('id',clickIds):{data:[]}
 for(const click of clicks||[])if(click.offer_id)offerIds.push(click.offer_id)
 const {data:offers}=offerIds.length?await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').in('id',[...new Set(offerIds)]):{data:[]}
 const queue=rows.map((row:any)=>({row,result:reconcileAffiliateRow(row,clicks||[],offers||[])})).filter(x=>x.result.state!=='complete')
 const selectedState=['enrichable','conflict','unresolved'].includes(params.state||'')?params.state:''
 const visibleQueue=selectedState?queue.filter(x=>x.result.state===selectedState):queue
 const clickById=new Map((clicks||[]).map((x:any)=>[Number(x.id),x])),offerById=new Map((offers||[]).map((x:any)=>[Number(x.id),x]))
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Affiliate reconciliation</h1><p>Review incomplete or conflicting commission attribution before it is used for performance reporting.</p></div><Link className="button ghost" href="/admin/monetization">Revenue Center</Link></div>
  {params.error&&<p className="form-error" role="alert">{params.error}</p>}{params.message&&<p className="form-success" role="status">{params.message}</p>}
  <div className="admin-stats"><span><b>{queue.filter(x=>x.result.state==='enrichable').length}</b>Safe to auto-fill</span><span><b>{queue.filter(x=>x.result.state==='conflict').length}</b>Conflicts</span><span><b>{queue.filter(x=>x.result.state==='unresolved').length}</b>Unresolved</span></div>
  <p className="muted">Conflict records are never automatically overwritten. Save only attribution you have verified against the affiliate network or ScentMarked tracking data.</p>
  <div className="admin-filters">{queue.some(x=>x.result.state==='enrichable')&&<form action={bulkEnrichAffiliateAttribution}><button className="button">Auto-fill all verified matches</button></form>}<Link className="button ghost" href="/admin/monetization/review">All ({queue.length})</Link><Link className="button ghost" href="/admin/monetization/review?state=enrichable">Safe ({queue.filter(x=>x.result.state==='enrichable').length})</Link><Link className="button ghost" href="/admin/monetization/review?state=conflict">Conflicts ({queue.filter(x=>x.result.state==='conflict').length})</Link><Link className="button ghost" href="/admin/monetization/review?state=unresolved">Unresolved ({queue.filter(x=>x.result.state==='unresolved').length})</Link></div>
  <div className="admin-list">{visibleQueue.length?visibleQueue.map(({row,result}:any)=>{
   const click:any=row.affiliate_click_id?clickById.get(Number(row.affiliate_click_id)):null,offer:any=(row.affiliate_offer_id||click?.offer_id)?offerById.get(Number(row.affiliate_offer_id||click?.offer_id)):null
   const suggestedOffer=row.affiliate_offer_id||click?.offer_id||null,suggestedMerchant=row.affiliate_merchant||offer?.merchant_name||null,suggestedPlacement=row.affiliate_placement||click?.placement||null,suggestedPerfume=row.perfume_id||click?.perfume_id||offer?.perfume_id||null
   return <article key={row.id}>
    <div><small>{result.state.toUpperCase()} · {row.source_name} · {row.external_id||'No external ID'}</small><h2>{money(Number(row.gross_cents||0)-Number(row.fee_cents||0),row.currency)} commission</h2><div className="admin-record-meta"><span>{new Date(row.occurred_at).toLocaleString()}</span><span>{row.status}</span><span>{result.reasons.join(', ').replaceAll('_',' ')}</span></div></div>
    {result.state==='enrichable'&&<p className="muted"><b>Verified suggestion:</b> offer {suggestedOffer||'—'} · {suggestedMerchant||'merchant unknown'} · {suggestedPlacement||'placement unknown'} · perfume {suggestedPerfume||'unknown'}</p>}
    <form action={updateAffiliateAttribution} className="admin-filters">
     <input type="hidden" name="id" value={row.id}/>
     <label>Click ID<input name="affiliate_click_id" type="number" min="1" defaultValue={row.affiliate_click_id||''}/></label>
     <label>Offer ID<input name="affiliate_offer_id" type="number" min="1" defaultValue={suggestedOffer||''}/></label>
     <label>Merchant<input name="affiliate_merchant" defaultValue={suggestedMerchant||''}/></label>
     <label>Placement<input name="affiliate_placement" defaultValue={suggestedPlacement||''}/></label>
     <label>Perfume ID<input name="perfume_id" defaultValue={suggestedPerfume||''}/></label>
     <button className="button ghost">Save attribution</button>
    </form>
   </article>
  }):<div className="empty-state"><h2>{selectedState?'No '+selectedState+' commissions.':'Reconciliation queue is clear.'}</h2><p>{selectedState?'Choose another filter to review the remaining queue.':'There are no incomplete or conflicting affiliate commissions to review.'}</p></div>}</div>
 </section></main>
}
