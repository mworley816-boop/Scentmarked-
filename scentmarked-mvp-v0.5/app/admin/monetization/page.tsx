import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { money, monetizationSummary } from '@/lib/monetization'

export const metadata={title:'Monetization | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function MonetizationPage(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')

 let transactions:any[]=[],campaigns:any[]=[],clickCount=0,configured=true
 try{
  const service=createServiceClient()
  const [tx,sp,clicks]=await Promise.all([
   service.from('monetization_transactions').select('revenue_type,gross_cents,fee_cents,status,occurred_at,currency').order('occurred_at',{ascending:false}).limit(5000),
   service.from('sponsorship_campaigns').select('id,name,sponsor_name,placement,status,starts_at,ends_at,budget_cents,currency').order('created_at',{ascending:false}).limit(100),
   service.from('affiliate_clicks').select('*',{count:'exact',head:true})
  ])
  if(!tx.error)transactions=tx.data||[]
  if(!sp.error)campaigns=sp.data||[]
  clickCount=clicks.count||0
 }catch{configured=false}

 const summary=monetizationSummary(transactions)
 const types=['affiliate','sponsorship','advertising','subscription'] as const
 const activeCampaigns=campaigns.filter((x:any)=>x.status==='active'||x.status==='scheduled')

 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Monetization</h1><p>Revenue infrastructure across affiliate commerce, sponsorships, advertising and future premium memberships.</p></div><div><Link className="button ghost" href="/admin/affiliates">Affiliate Analytics</Link><Link className="button ghost" href="/admin">Studio</Link></div></div>
  {!configured&&<div className="empty-state"><h2>Revenue reporting is not connected in this environment.</h2><p>Configure the server-only Supabase service role to read protected financial records. Public site functionality is unaffected.</p></div>}
  <div className="admin-stats"><span><b>{money(summary.grossCents)}</b>Gross tracked revenue</span><span><b>{money(summary.netCents)}</b>Net tracked revenue</span><span><b>{money(summary.feeCents)}</b>Tracked fees</span><span><b>{clickCount}</b>Affiliate outbound clicks</span><span><b>{activeCampaigns.length}</b>Active / scheduled sponsors</span></div>
  <p className="muted">Affiliate clicks are traffic signals, not sales. Revenue totals include only imported or recorded monetization transactions and exclude refunded or void transactions.</p>
  <h2>Revenue streams</h2>
  <div className="admin-stats">{types.map(type=><span key={type}><b>{money(summary.byType.get(type)||0)}</b>{type[0].toUpperCase()+type.slice(1)}</span>)}</div>
  <h2>Sponsorship inventory</h2>
  <div className="admin-list">{campaigns.length?campaigns.map((x:any)=><article key={x.id}><div><small>{x.status.toUpperCase()} · {x.placement}</small><h2>{x.name}</h2><div className="admin-record-meta"><span>{x.sponsor_name}</span>{x.budget_cents!=null&&<span>{money(x.budget_cents,x.currency)} budget</span>}</div></div></article>):<div className="empty-state"><h2>No sponsorship campaigns yet.</h2><p>The infrastructure is ready for direct sponsored placements without changing fragrance recommendation scores.</p></div>}</div>
 </section></main>
}
