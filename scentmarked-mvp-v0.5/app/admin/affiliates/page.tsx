import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { affiliateClickWithinPeriod, affiliateExportPeriod } from '@/lib/affiliate-export'

export const metadata={title:'Affiliate Performance | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function AffiliatePerformance({searchParams}:{searchParams:Promise<{period?:string}>}){
 const params=await searchParams
 const period=affiliateExportPeriod(params.period??null)
 const s=await createClient()
 let user:any=null
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/admin/affiliates')
 let isAdmin=false
 try{const r=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();isAdmin=r.data?.is_admin===true}catch{}
 if(!isAdmin)redirect('/discover')

 let clicks:any[]=[],offers:any[]=[],perfumes:any[]=[]
 try{
  const [o,p]=await Promise.all([
   s.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name,is_active,priority').order('priority',{ascending:true}),
   s.from('perfumes').select('id,name,slug,brands(name)').eq('status','published')
  ])
  if(!o.error)offers=o.data||[]
  if(!p.error)perfumes=p.data||[]
  const pageSize=1000
  for(let from=0;;from+=pageSize){
   const c=await s.from('affiliate_clicks').select('offer_id,perfume_id,placement,clicked_at').order('clicked_at',{ascending:false}).range(from,from+pageSize-1)
   if(c.error)break
   const rows=c.data||[]
   clicks.push(...rows)
   if(rows.length<pageSize)break
  }
 }catch{}

 const reportingNow=Date.now()
 const recent=(x:any)=>affiliateClickWithinPeriod(x.clicked_at,'30',reportingNow)
 const recent7=(x:any)=>affiliateClickWithinPeriod(x.clicked_at,'7',reportingNow)
 const dayKey=(d:Date)=>d.toISOString().slice(0,10)
 const daily=Array.from({length:7},(_,i)=>{const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(6-i));const key=dayKey(d);return {key,label:new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(d),count:clicks.filter((x:any)=>dayKey(new Date(x.clicked_at))===key).length}})
 const activeOffers=offers.filter((o:any)=>o.is_active)
 const offerById=new Map(activeOffers.map((o:any)=>[String(o.id),o]))
 const merchantMap=new Map<string,{name:string,total:number,recent:number,recent7:number,period:number,offers:Set<string>}>()
 const perfumeMap=new Map<string,{total:number,recent:number,recent7:number,period:number}>()
 for(const o of activeOffers){
  const name=String(o.merchant_name||'Retailer')
  if(!merchantMap.has(name))merchantMap.set(name,{name,total:0,recent:0,recent7:0,period:0,offers:new Set()})
  merchantMap.get(name)!.offers.add(String(o.id))
 }
 const periodMatch=(x:any)=>period==='7'?recent7(x):period==='30'?recent(x):true
 for(const x of clicks){
  const pkey=String(x.perfume_id)
  const ps=perfumeMap.get(pkey)||{total:0,recent:0,recent7:0,period:0}
  ps.total++;if(recent(x))ps.recent++;if(recent7(x))ps.recent7++;if(periodMatch(x))ps.period++
  perfumeMap.set(pkey,ps)
  const offer=offerById.get(String(x.offer_id))
  if(offer){
   const ms=merchantMap.get(String(offer.merchant_name||'Retailer'))!
   ms.total++;if(recent(x))ms.recent++;if(recent7(x))ms.recent7++;if(periodMatch(x))ms.period++
  }
 }
 const merchantStats=[...merchantMap.values()].map(m=>({...m,offers:m.offers.size})).sort((a,b)=>b.period-a.period||b.total-a.total||a.name.localeCompare(b.name))
 const perfumeStats=perfumes.map((p:any)=>({p,...(perfumeMap.get(String(p.id))||{total:0,recent:0,recent7:0,period:0})})).filter((x:any)=>x.total>0).sort((a:any,b:any)=>b.period-a.period||b.total-a.total).slice(0,25)
 const periodClicks=period==='7'?clicks.filter(recent7):period==='30'?clicks.filter(recent):clicks
 const periodLabel=period==='7'?'Last 7 days':period==='30'?'Last 30 days':'All time'
 const featured=periodClicks.filter((x:any)=>x.placement==='profile_featured').length
 const more=periodClicks.filter((x:any)=>x.placement==='profile_more').length
 const placementTotal=featured+more
 const featuredShare=placementTotal?Math.round(featured/placementTotal*100):0
 const moreShare=placementTotal?Math.round(more/placementTotal*100):0

 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Affiliate Performance</h1><p>Track outbound retailer interest without affecting scent recommendations.</p></div><Link className="button ghost" href="/admin">Catalog Studio</Link></div>
  <form action="/admin/affiliates" className="admin-filters"><label className="sr-only" htmlFor="affiliate-period">Reporting period</label><select id="affiliate-period" name="period" defaultValue={period}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select><button className="button">Apply</button><a className="button ghost" href={'/admin/affiliates/export?period='+period}>Export CSV</a></form>
  <div className="admin-stats"><span><b>{periodClicks.length}</b>{periodLabel} clicks</span><span><b>{featured}</b>Featured retailer clicks</span><span><b>{more}</b>Additional retailer clicks</span><span><b>{merchantStats.length}</b>Active merchants</span></div>
  <h2>Placement performance</h2>
  <div className="admin-stats"><span><b>{featuredShare}%</b>Featured placement share</span><span><b>{moreShare}%</b>Additional retailer share</span></div>
  <p className="muted">Placement share describes where tracked outbound clicks occurred during the selected reporting period. It does not measure purchases or prove that placement caused the difference.</p>

  <h2>Last 7 days</h2>
  <div className="admin-stats">{daily.map((d:any)=><span key={d.key}><b>{d.count}</b>{d.label}</span>)}</div>

  <h2>Retailer performance</h2>
  <div className="admin-list">{merchantStats.length?merchantStats.map((m:any)=><article key={m.name}><div><small>RETAILER</small><h2>{m.name}</h2><div className="admin-record-meta"><span>{m.period} {periodLabel.toLowerCase()}</span><span>{m.total} all time</span><span>{m.recent} last 30d</span><span>{m.recent7} last 7d</span><span>{m.offers} active offer{m.offers===1?'':'s'}</span></div></div></article>):<div className="empty-state"><h2>No active retailer performance yet.</h2></div>}</div>

  <h2>Top fragrances</h2>
  <div className="admin-list">{perfumeStats.length?perfumeStats.map(({p,total,recent,recent7,period:periodClicksForPerfume}:any)=><article key={p.id}><div><small>{p.brands?.name||'Brand'}</small><h2>{p.name}</h2><div className="admin-record-meta"><span>{periodClicksForPerfume} {periodLabel.toLowerCase()}</span><span>{total} all time</span><span>{recent} last 30d</span><span>{recent7} last 7d</span></div></div><div><Link className="button ghost" href={'/perfume/'+p.slug}>View</Link><Link className="button" href={'/admin/perfumes/'+p.id+'/edit#affiliate-offers'}>Retailers</Link></div></article>):<div className="empty-state"><h2>No retailer clicks have been recorded yet.</h2></div>}</div>
 </section></main>
}
