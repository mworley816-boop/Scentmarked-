import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { reconcileAffiliateRow } from '@/lib/affiliate-reconciliation'
import { money } from '@/lib/monetization'
import { updateAffiliateAttribution } from '../actions'

export const metadata={title:'Affiliate Reconciliation | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function AffiliateReconciliationPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
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
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Affiliate reconciliation</h1><p>Review incomplete or conflicting commission attribution before it is used for performance reporting.</p></div><Link className="button ghost" href="/admin/monetization">Revenue Center</Link></div>
  {params.error&&<p className="form-error" role="alert">{params.error}</p>}{params.message&&<p className="form-success" role="status">{params.message}</p>}
  <div className="admin-stats"><span><b>{queue.filter(x=>x.result.state==='enrichable').length}</b>Safe to auto-fill</span><span><b>{queue.filter(x=>x.result.state==='conflict').length}</b>Conflicts</span><span><b>{queue.filter(x=>x.result.state==='unresolved').length}</b>Unresolved</span></div>
  <p className="muted">Conflict records are never automatically overwritten. Save only attribution you have verified against the affiliate network or ScentMarked tracking data.</p>
  <div className="admin-list">{queue.length?queue.map(({row,result}:any)=><article key={row.id}>
   <div><small>{result.state.toUpperCase()} · {row.source_name} · {row.external_id||'No external ID'}</small><h2>{money(Number(row.gross_cents||0)-Number(row.fee_cents||0),row.currency)} commission</h2><div className="admin-record-meta"><span>{new Date(row.occurred_at).toLocaleString()}</span><span>{row.status}</span><span>{result.reasons.join(', ').replaceAll('_',' ')}</span></div></div>
   <form action={updateAffiliateAttribution} className="admin-filters">
    <input type="hidden" name="id" value={row.id}/>
    <label>Click ID<input name="affiliate_click_id" type="number" min="1" defaultValue={row.affiliate_click_id||''}/></label>
    <label>Offer ID<input name="affiliate_offer_id" type="number" min="1" defaultValue={row.affiliate_offer_id||''}/></label>
    <label>Merchant<input name="affiliate_merchant" defaultValue={row.affiliate_merchant||''}/></label>
    <label>Placement<input name="affiliate_placement" defaultValue={row.affiliate_placement||''}/></label>
    <label>Perfume ID<input name="perfume_id" defaultValue={row.perfume_id||''}/></label>
    <button className="button ghost">Save attribution</button>
   </form>
  </article>):<div className="empty-state"><h2>Reconciliation queue is clear.</h2><p>There are no incomplete or conflicting affiliate commissions to review.</p></div>}</div>
 </section></main>
}
