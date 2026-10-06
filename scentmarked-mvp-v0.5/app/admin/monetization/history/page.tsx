import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata={title:'Attribution History | ScentMarked Studio',robots:{index:false,follow:false}}

const fields=['affiliate_click_id','affiliate_offer_id','affiliate_merchant','affiliate_placement','perfume_id']
const display=(v:any)=>v===null||v===undefined||v===''?'—':String(v)

export default async function AttributionHistoryPage(){
 const s=await createClient(),{data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization/history')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 const service=createServiceClient()
 const {data:audit}=await service.from('affiliate_attribution_audit').select('id,transaction_id,changed_by,change_source,before_values,after_values,created_at').order('created_at',{ascending:false}).limit(250)
 const userIds=[...new Set((audit||[]).map((x:any)=>x.changed_by).filter(Boolean))]
 const {data:admins}=userIds.length?await service.from('profiles').select('id,display_name').in('id',userIds):{data:[]}
 const adminById=new Map((admins||[]).map((x:any)=>[x.id,x.display_name||'Admin']))
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Attribution history</h1><p>Immutable history of manual and automatic affiliate commission attribution changes.</p></div><div className="admin-filters"><Link className="button ghost" href="/admin/monetization/review">Review queue</Link><Link className="button ghost" href="/admin/monetization">Revenue Center</Link></div></div>
  <div className="admin-list">{(audit||[]).length?(audit||[]).map((entry:any)=>{
   const before=entry.before_values||{},after=entry.after_values||{},changed=fields.filter(k=>display(before[k])!==display(after[k]))
   return <article key={entry.id}>
    <div><small>{entry.change_source.toUpperCase()} · Transaction #{entry.transaction_id}</small><h2>{entry.change_source==='automatic'?'Verified tracking enrichment':'Manual attribution edit'}</h2><div className="admin-record-meta"><span>{new Date(entry.created_at).toLocaleString()}</span><span>{entry.changed_by?adminById.get(entry.changed_by)||'Admin':'System'}</span><span>{changed.length} field{changed.length===1?'':'s'} changed</span></div></div>
    {changed.length?<div className="admin-list">{changed.map(k=><div key={k}><b>{k.replaceAll('_',' ')}</b><p className="muted">{display(before[k])} → {display(after[k])}</p></div>)}</div>:<p className="muted">No attribution field value changed.</p>}
   </article>
  }):<div className="empty-state"><h2>No attribution edits yet.</h2><p>Manual corrections and verified automatic enrichment will appear here.</p></div>}</div>
 </section></main>
}
