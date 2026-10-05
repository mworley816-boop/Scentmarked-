import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { affiliateMetrics, money, monetizationSummary } from '@/lib/monetization'\nimport { createSponsorship, recordRevenue, updateSponsorshipStatus } from './actions'

export const metadata={title:'Monetization | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function MonetizationPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){\n const params=await searchParams
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

 const summary=monetizationSummary(transactions)\n const affiliate=affiliateMetrics(clickCount,transactions)
 const types=['affiliate','sponsorship','advertising','subscription'] as const
 const activeCampaigns=campaigns.filter((x:any)=>x.status==='active'||x.status==='scheduled')

 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Monetization</h1><p>Revenue infrastructure across affiliate commerce, sponsorships, advertising and future premium memberships.</p></div><div><Link className="button ghost" href="/admin/affiliates">Affiliate Analytics</Link><Link className="button ghost" href="/admin">Studio</Link></div></div>
  {params.error&&<p className="form-error" role="alert">{params.error}</p>}{params.message&&<p className="form-success" role="status">{params.message}</p>}
  <div className="admin-card"><h2>Record revenue</h2><p className="muted">Use this for affiliate commission reports, direct sponsorship invoices, ad revenue or subscription revenue until automated provider imports are connected.</p><form action={recordRevenue} className="admin-filters"><select name="revenue_type" required><option value="affiliate">Affiliate</option><option value="sponsorship">Sponsorship</option><option value="advertising">Advertising</option><option value="subscription">Subscription</option><option value="other">Other</option></select><input name="source_name" required placeholder="Source / network"/><input name="external_id" placeholder="External transaction ID"/><input name="gross" type="number" min="0" step="0.01" required placeholder="Gross $"/><input name="fees" type="number" min="0" step="0.01" defaultValue="0" placeholder="Fees $"/><input name="currency" defaultValue="USD" maxLength={3}/><select name="status"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option><option value="refunded">Refunded</option><option value="void">Void</option></select><input name="occurred_at" type="datetime-local"/><input name="notes" placeholder="Notes"/><button className="button">Record Revenue</button></form></div>
  <div className="admin-card"><h2>Create sponsorship campaign</h2><form action={createSponsorship} className="admin-filters"><input name="name" required placeholder="Campaign name"/><input name="sponsor_name" required placeholder="Sponsor"/><input name="placement" required placeholder="Placement, e.g. homepage_banner"/><input name="destination_url" type="url" placeholder="https://…"/><input name="budget" type="number" min="0" step="0.01" placeholder="Budget $"/><input name="currency" defaultValue="USD" maxLength={3}/><input name="starts_at" type="datetime-local"/><input name="ends_at" type="datetime-local"/><select name="status"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><input name="disclosure_label" defaultValue="Sponsored" placeholder="Disclosure label"/><button className="button">Create Campaign</button></form></div>
  {!configured&&<div className="empty-state"><h2>Revenue reporting is not connected in this environment.</h2><p>Configure the server-only Supabase service role to read protected financial records. Public site functionality is unaffected.</p></div>}
  <div className="admin-stats"><span><b>{money(summary.grossCents)}</b>Gross tracked revenue</span><span><b>{money(summary.netCents)}</b>Net tracked revenue</span><span><b>{money(summary.feeCents)}</b>Tracked fees</span><span><b>{clickCount}</b>Affiliate outbound clicks</span><span><b>{activeCampaigns.length}</b>Active / scheduled sponsors</span></div>
  <p className="muted">Affiliate clicks are traffic signals, not sales. Revenue totals include only imported or recorded monetization transactions and exclude refunded or void transactions.</p>\n  <h2>Affiliate conversion funnel</h2><div className="admin-stats"><span><b>{affiliate.clicks}</b>Tracked clicks</span><span><b>{affiliate.conversions}</b>Recorded conversions</span><span><b>{(affiliate.conversionRate*100).toFixed(2)}%</b>Conversion rate</span><span><b>{money(affiliate.epcCents)}</b>Earnings per click</span><span><b>{money(affiliate.averageCommissionCents)}</b>Average commission</span></div><p className="muted">Conversion metrics become meaningful as affiliate network sale/commission reports are imported. A click alone is never counted as a conversion.</p>
  <h2>Revenue streams</h2>
  <div className="admin-stats">{types.map(type=><span key={type}><b>{money(summary.byType.get(type)||0)}</b>{type[0].toUpperCase()+type.slice(1)}</span>)}</div>
  <h2>Sponsorship inventory</h2>
  <div className="admin-list">{campaigns.length?campaigns.map((x:any)=><article key={x.id}><div><small>{x.status.toUpperCase()} · {x.placement}</small><h2>{x.name}</h2><div className="admin-record-meta"><span>{x.sponsor_name}</span>{x.budget_cents!=null&&<span>{money(x.budget_cents,x.currency)} budget</span>}</div></div><form action={updateSponsorshipStatus} className="admin-filters"><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button className="button ghost">Update</button></form></article>):<div className="empty-state"><h2>No sponsorship campaigns yet.</h2><p>The infrastructure is ready for direct sponsored placements without changing fragrance recommendation scores.</p></div>}</div>
 </section></main>
}
