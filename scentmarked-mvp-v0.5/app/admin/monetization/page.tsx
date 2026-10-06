import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { affiliateMetrics, money, monetizationSummary } from '@/lib/monetization'
import { subscriptionMetrics } from '@/lib/subscription-metrics'
import { createSponsorship, recordRevenue, updateSponsorshipStatus, updateMembershipPlan, grantMembership, endManualMembership } from './actions'

export const metadata={title:'Monetization | ScentMarked Studio',robots:{index:false,follow:false}}

export default async function MonetizationPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const params=await searchParams
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')

 let transactions:any[]=[],campaigns:any[]=[],sponsorEvents:any[]=[],plans:any[]=[],subscriptions:any[]=[],clickCount=0,configured=true
 try{
  const service=createServiceClient()
  const [tx,sp,events,planRows,subscriptionRows,clicks]=await Promise.all([
   service.from('monetization_transactions').select('revenue_type,gross_cents,fee_cents,status,occurred_at,currency').order('occurred_at',{ascending:false}).limit(5000),
   service.from('sponsorship_campaigns').select('id,name,sponsor_name,placement,status,starts_at,ends_at,budget_cents,currency').order('created_at',{ascending:false}).limit(100),
   service.from('sponsorship_events').select('campaign_id,event_type,placement,occurred_at').order('occurred_at',{ascending:false}).limit(10000),
   service.from('membership_plans').select('id,slug,name,description,price_cents,billing_interval,currency,entitlements,is_active,sort_order').order('sort_order'),
   service.from('member_subscriptions').select('id,user_id,plan_id,provider,status,current_period_end,cancel_at_period_end').in('status',['trialing','active','past_due']).limit(5000),
   service.from('affiliate_clicks').select('*',{count:'exact',head:true})
  ])
  if(!tx.error)transactions=tx.data||[]
  if(!sp.error)campaigns=sp.data||[]
  if(!events.error)sponsorEvents=events.data||[]
  if(!planRows.error)plans=planRows.data||[]
  if(!subscriptionRows.error)subscriptions=subscriptionRows.data||[]
  clickCount=clicks.count||0
 }catch{configured=false}

 const summary=monetizationSummary(transactions)
 const affiliate=affiliateMetrics(clickCount,transactions)
 const types=['affiliate','sponsorship','advertising','subscription'] as const
 const activeCampaigns=campaigns.filter((x:any)=>x.status==='active'||x.status==='scheduled')
 const membershipStats=subscriptionMetrics(subscriptions),premiumMembers=membershipStats.active
 const sponsorImpressions=sponsorEvents.filter((x:any)=>x.event_type==='impression').length,sponsorClicks=sponsorEvents.filter((x:any)=>x.event_type==='click').length,sponsorCtr=sponsorImpressions?sponsorClicks/sponsorImpressions:0

 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Monetization</h1><p>Revenue infrastructure across affiliate commerce, sponsorships, advertising and future premium memberships.</p></div><div><Link className="button ghost" href="/admin/affiliates">Affiliate Analytics</Link><Link className="button ghost" href="/admin">Studio</Link></div></div>
  {params.error&&<p className="form-error" role="alert">{params.error}</p>}{params.message&&<p className="form-success" role="status">{params.message}</p>}
  <div className="admin-card"><h2>Record revenue</h2><p className="muted">Use this for affiliate commission reports, direct sponsorship invoices, ad revenue or subscription revenue until automated provider imports are connected.</p><form action={recordRevenue} className="admin-filters"><select name="revenue_type" required><option value="affiliate">Affiliate</option><option value="sponsorship">Sponsorship</option><option value="advertising">Advertising</option><option value="subscription">Subscription</option><option value="other">Other</option></select><input name="source_name" required placeholder="Source / network"/><input name="external_id" placeholder="External transaction ID"/><input name="gross" type="number" min="0" step="0.01" required placeholder="Gross $"/><input name="fees" type="number" min="0" step="0.01" defaultValue="0" placeholder="Fees $"/><input name="currency" defaultValue="USD" maxLength={3}/><select name="status"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option><option value="refunded">Refunded</option><option value="void">Void</option></select><input name="occurred_at" type="datetime-local"/><input name="notes" placeholder="Notes"/><button className="button">Record Revenue</button></form></div>
  <div className="admin-card"><h2>Create sponsorship campaign</h2><form action={createSponsorship} className="admin-filters"><input name="name" required placeholder="Campaign name"/><input name="sponsor_name" required placeholder="Sponsor"/><input name="placement" required placeholder="Placement, e.g. homepage_banner"/><input name="destination_url" type="url" placeholder="https://…"/><input name="budget" type="number" min="0" step="0.01" placeholder="Budget $"/><input name="currency" defaultValue="USD" maxLength={3}/><input name="starts_at" type="datetime-local"/><input name="ends_at" type="datetime-local"/><select name="status"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><input name="disclosure_label" defaultValue="Sponsored" placeholder="Disclosure label"/><button className="button">Create Campaign</button></form></div>
  {!configured&&<div className="empty-state"><h2>Revenue reporting is not connected in this environment.</h2><p>Configure the server-only Supabase service role to read protected financial records. Public site functionality is unaffected.</p></div>}
  <div className="admin-stats"><span><b>{money(summary.grossCents)}</b>Gross tracked revenue</span><span><b>{money(summary.netCents)}</b>Net tracked revenue</span><span><b>{money(summary.feeCents)}</b>Tracked fees</span><span><b>{clickCount}</b>Affiliate outbound clicks</span><span><b>{activeCampaigns.length}</b>Active / scheduled sponsors</span></div>
  <p className="muted">Affiliate clicks are traffic signals, not sales. Revenue totals include only imported or recorded monetization transactions and exclude refunded or void transactions.</p>
  <h2>Affiliate conversion funnel</h2><div className="admin-stats"><span><b>{affiliate.clicks}</b>Tracked clicks</span><span><b>{affiliate.conversions}</b>Recorded conversions</span><span><b>{(affiliate.conversionRate*100).toFixed(2)}%</b>Conversion rate</span><span><b>{money(affiliate.epcCents)}</b>Earnings per click</span><span><b>{money(affiliate.averageCommissionCents)}</b>Average commission</span></div><p className="muted">Conversion metrics become meaningful as affiliate network sale/commission reports are imported. A click alone is never counted as a conversion.</p>
  <h2>Revenue streams</h2>
  <div className="admin-stats">{types.map(type=><span key={type}><b>{money(summary.byType.get(type)||0)}</b>{type[0].toUpperCase()+type.slice(1)}</span>)}</div>
  <div className="admin-card"><h2>Grant premium access</h2><p className="muted">For testing, staff, promotions or complimentary access. Manual grants do not represent a payment.</p><form action={grantMembership} className="admin-filters"><input name="email" type="email" required placeholder="Member email"/><select name="plan_id" required><option value="">Choose premium plan</option>{plans.filter((x:any)=>x.is_active&&x.slug!=='free').map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input name="days" type="number" min="1" max="3660" defaultValue="30" aria-label="Access days"/><button className="button">Grant Access</button></form></div>
  <h2>Membership</h2><div className="admin-stats"><span><b>{premiumMembers}</b>Active / trialing premium members</span><span><b>{plans.filter((x:any)=>x.is_active).length}</b>Active plans</span><span><b>{membershipStats.trialing}</b>Trials</span><span><b>{membershipStats.manual}</b>Manual grants</span><span><b>{membershipStats.pastDue}</b>Past due</span><span><b>{membershipStats.cancelAtPeriodEnd}</b>Ending at period close</span></div><div className="admin-list">{plans.map((plan:any)=><article key={plan.id}><form action={updateMembershipPlan} className="admin-filters"><input type="hidden" name="id" value={plan.id}/><label>Plan<input name="name" defaultValue={plan.name} required/></label><label>Price<input name="price" type="number" min="0" step="0.01" defaultValue={(Number(plan.price_cents||0)/100).toFixed(2)}/></label><label>Billing<select name="billing_interval" defaultValue={plan.billing_interval}><option value="month">Monthly</option><option value="year">Yearly</option><option value="one_time">One time</option></select></label><label>Currency<input name="currency" defaultValue={plan.currency} maxLength={3}/></label><label>Entitlements<input name="entitlements" defaultValue={(plan.entitlements||[]).join(', ')}/></label><label>Description<input name="description" defaultValue={plan.description||''}/></label><label><input name="is_active" type="checkbox" defaultChecked={plan.is_active}/> Active</label><button className="button ghost">Save {plan.slug}</button></form></article>)}</div>{subscriptions.filter((x:any)=>x.provider==='manual'&&['trialing','active'].includes(x.status)).length>0&&<><h3>Manual premium access</h3><div className="admin-list">{subscriptions.filter((x:any)=>x.provider==='manual'&&['trialing','active'].includes(x.status)).map((x:any)=><article key={x.id}><div><b>Member {String(x.user_id).slice(0,8)}…</b><small>{x.status.toUpperCase()} · ends {x.current_period_end?new Date(x.current_period_end).toLocaleDateString():'No end date'}</small></div><form action={endManualMembership}><input type="hidden" name="id" value={x.id}/><button className="button ghost">End access</button></form></article>)}</div></>}<p className="muted">Plan settings define access and display pricing only. No payment provider is connected yet, so changing a price here cannot charge a member.</p>
  <h2>Sponsorship performance</h2><div className="admin-stats"><span><b>{sponsorImpressions}</b>Impressions</span><span><b>{sponsorClicks}</b>Clicks</span><span><b>{(sponsorCtr*100).toFixed(2)}%</b>CTR</span></div>
  <h2>Sponsorship inventory</h2>
  <div className="admin-list">{campaigns.length?campaigns.map((x:any)=><article key={x.id}><div><small>{x.status.toUpperCase()} · {x.placement}</small><h2>{x.name}</h2><div className="admin-record-meta"><span>{x.sponsor_name}</span>{x.budget_cents!=null&&<span>{money(x.budget_cents,x.currency)} budget</span>}</div></div><form action={updateSponsorshipStatus} className="admin-filters"><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button className="button ghost">Update</button></form></article>):<div className="empty-state"><h2>No sponsorship campaigns yet.</h2><p>The infrastructure is ready for direct sponsored placements without changing fragrance recommendation scores.</p></div>}</div>
 </section></main>
}
