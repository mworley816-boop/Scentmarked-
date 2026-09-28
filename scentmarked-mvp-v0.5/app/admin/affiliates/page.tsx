import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata={title:'Affiliate Performance | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function AffiliatePerformance(){
 const s=await createClient()
 let user:any=null
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/admin/affiliates')
 let isAdmin=false
 try{const r=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();isAdmin=r.data?.is_admin===true}catch{}
 if(!isAdmin)redirect('/discover')

 let clicks:any[]=[],offers:any[]=[],perfumes:any[]=[]
 try{
  const [c,o,p]=await Promise.all([
   s.from('affiliate_clicks').select('offer_id,perfume_id,placement,clicked_at').order('clicked_at',{ascending:false}).limit(10000),
   s.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name,is_active,priority').order('priority',{ascending:true}),
   s.from('perfumes').select('id,name,slug,brands(name)').eq('status','published')
  ])
  if(!c.error)clicks=c.data||[]
  if(!o.error)offers=o.data||[]
  if(!p.error)perfumes=p.data||[]
 }catch{}

 const recent=(x:any)=>Date.now()-new Date(x.clicked_at).getTime()<=30*24*60*60*1000
 const recent7=(x:any)=>Date.now()-new Date(x.clicked_at).getTime()<=7*24*60*60*1000
 const dayKey=(d:Date)=>d.toISOString().slice(0,10)
 const daily=Array.from({length:7},(_,i)=>{const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(6-i));const key=dayKey(d);return {key,label:new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(d),count:clicks.filter((x:any)=>dayKey(new Date(x.clicked_at))===key).length}})
 const perfumeById=new Map(perfumes.map((p:any)=>[String(p.id),p]))
 const merchantStats=[...new Set(offers.filter((o:any)=>o.is_active).map((o:any)=>o.merchant_name))].map(name=>{
  const ids=new Set(offers.filter((o:any)=>o.is_active&&o.merchant_name===name).map((o:any)=>String(o.id)))
  const rows=clicks.filter((x:any)=>ids.has(String(x.offer_id)))
  return {name,total:rows.length,recent:rows.filter(recent).length,recent7:rows.filter(recent7).length,offers:ids.size}
 }).sort((a:any,b:any)=>b.recent-a.recent||b.total-a.total||a.name.localeCompare(b.name))
 const perfumeStats=perfumes.map((p:any)=>{
  const rows=clicks.filter((x:any)=>String(x.perfume_id)===String(p.id))
  return {p,total:rows.length,recent:rows.filter(recent).length,recent7:rows.filter(recent7).length}
 }).filter((x:any)=>x.total>0).sort((a:any,b:any)=>b.recent-a.recent||b.total-a.total).slice(0,25)
 const featured=clicks.filter((x:any)=>x.placement==='profile_featured').length
 const more=clicks.filter((x:any)=>x.placement==='profile_more').length

 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Affiliate Performance</h1><p>Track outbound retailer interest without affecting scent recommendations.</p></div><Link className="button ghost" href="/admin">Catalog Studio</Link></div>
  <div className="admin-stats"><span><b>{clicks.length}</b>Total retailer clicks</span><span><b>{clicks.filter(recent).length}</b>Last 30 days</span><span><b>{clicks.filter(recent7).length}</b>Last 7 days</span><span><b>{featured}</b>Featured retailer clicks</span><span><b>{more}</b>Additional retailer clicks</span><span><b>{merchantStats.length}</b>Active merchants</span></div>

  <h2>Last 7 days</h2>
  <div className="admin-stats">{daily.map((d:any)=><span key={d.key}><b>{d.count}</b>{d.label}</span>)}</div>

  <h2>Retailer performance</h2>
  <div className="admin-list">{merchantStats.length?merchantStats.map((m:any)=><article key={m.name}><div><small>RETAILER</small><h2>{m.name}</h2><div className="admin-record-meta"><span>{m.total} click{m.total===1?'':'s'}</span><span>{m.recent} last 30d</span><span>{m.recent7} last 7d</span><span>{m.offers} active offer{m.offers===1?'':'s'}</span></div></div></article>):<div className="empty-state"><h2>No active retailer performance yet.</h2></div>}</div>

  <h2>Top fragrances</h2>
  <div className="admin-list">{perfumeStats.length?perfumeStats.map(({p,total,recent,recent7}:any)=><article key={p.id}><div><small>{p.brands?.name||'Brand'}</small><h2>{p.name}</h2><div className="admin-record-meta"><span>{total} retailer click{total===1?'':'s'}</span><span>{recent} last 30d</span><span>{recent7} last 7d</span></div></div><div><Link className="button ghost" href={'/perfume/'+p.slug}>View</Link><Link className="button" href={'/admin/perfumes/'+p.id+'/edit#affiliate-offers'}>Retailers</Link></div></article>):<div className="empty-state"><h2>No retailer clicks have been recorded yet.</h2></div>}</div>
 </section></main>
}
