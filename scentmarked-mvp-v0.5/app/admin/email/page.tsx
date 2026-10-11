import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Email Marketing',robots:{index:false,follow:false}}

async function requireAdmin(next='/admin/email'){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent(next))
  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin)redirect('/')
  return {s,user}
}

async function createCampaign(formData:FormData){
  'use server'
  const {s,user}=await requireAdmin()
  const name=String(formData.get('name')||'').trim().slice(0,120)
  const subject=String(formData.get('subject')||'').trim().slice(0,200)
  const segmentRaw=String(formData.get('segment_id')||'')
  const segmentId=segmentRaw?Number(segmentRaw):null
  if(!name||!subject)redirect('/admin/email?error='+encodeURIComponent('Campaign name and subject are required.'))
  if(segmentRaw&&!Number.isSafeInteger(segmentId))redirect('/admin/email?error='+encodeURIComponent('Choose a valid segment.'))
  const {data,error}=await s.from('email_campaigns').insert({
    name,subject,segment_id:segmentId,html_body:'<p>Start writing your ScentMarked email here.</p>',
    text_body:'Start writing your ScentMarked email here.',status:'draft',created_by:user.id
  }).select('id').single()
  if(error||!data)redirect('/admin/email?error='+encodeURIComponent('Campaign could not be created.'))
  redirect('/admin/email/'+data.id)
}

export default async function AdminEmail({searchParams}:{searchParams:Promise<{error?:string,page?:string}>}){
  const p=await searchParams
  const {s}=await requireAdmin()
  const pageInput=Number(p.page||'1')
  const page=Number.isSafeInteger(pageInput)&&pageInput>0?Math.min(pageInput,10000):1
  const pageSize=50

  const [{data:campaigns,error,count:totalCampaigns},{data:segments},{data:templates},deliveries,{count:emailable,error:emailableError},completedCountResult]=await Promise.all([
    s.from('email_campaigns').select('id,name,subject,status,scheduled_at,started_at,completed_at,created_at,crm_segments:segment_id(id,name)',{count:'exact'}).order('created_at',{ascending:false}).range((page-1)*pageSize,page*pageSize-1),
    s.from('crm_segments').select('id,name,is_active').eq('is_active',true).order('name'),
    s.from('email_templates').select('id,name,subject,updated_at').order('updated_at',{ascending:false}).limit(50),
    Promise.all(['queued','processing','sent','delivered','opened','clicked','bounced','failed','complained','unsubscribed','skipped'].map(async deliveryStatus=>({deliveryStatus,...await s.from('email_deliveries').select('id',{count:'exact',head:true}).eq('status',deliveryStatus)}))),
    s.from('crm_contacts').select('id',{count:'exact',head:true}).eq('status','active').eq('marketing_consent',true).not('marketing_consented_at','is',null).is('unsubscribed_at',null),
    s.from('email_campaigns').select('id',{count:'exact',head:true}).eq('status','sent')
  ])

  const campaignRows=campaigns||[]
  const segmentRows=segments||[]
  const templateRows=templates||[]
  const deliveryCounts=new Map(deliveries.map((x:any)=>[x.deliveryStatus,x.count||0]))
  const count=(status:string):number=>Number(deliveryCounts.get(status)||0)
  const sent=count('sent')+count('delivered')+count('opened')+count('clicked')
  const delivered=count('delivered')+count('opened')+count('clicked')
  const opened=count('opened')+count('clicked')
  const clicked=count('clicked')
  const bounced=count('bounced')
  const failed=count('failed')
  const complained=count('complained')
  const unsubscribed=count('unsubscribed')
  const skipped=count('skipped')
  const attempted=sent+bounced+failed+complained+unsubscribed
  const pending=count('queued')+count('processing')
  const deliveryMetricsError=deliveries.some((x:any)=>x.error||typeof x.count!=='number'||!Number.isSafeInteger(x.count)||x.count<0)
  const emailableCountUnavailable=emailableError!==null||typeof emailable!=='number'
  const campaignCount=campaignRows.length
  const completedCampaigns=completedCountResult.count??campaignRows.filter((x:any)=>x.status==='sent').length
  const completedCampaignsAreRecentOnly=completedCountResult.error!==null||typeof completedCountResult.count!=='number'
  const campaignListTruncated=typeof totalCampaigns==='number'?totalCampaigns>page*pageSize:campaignRows.length===pageSize
  const totalPages=typeof totalCampaigns==='number'?Math.ceil(totalCampaigns/pageSize):null
  const campaignStart=campaignRows.length?(page-1)*pageSize+1:0
  const campaignEnd=(page-1)*pageSize+campaignRows.length
  const campaignTotalUnavailable=error!==null||typeof totalCampaigns!=='number'
  const pct=(n:number,d:number)=>d?Math.round(n/d*1000)/10:0
  const metricsUpdatedAt=new Date().toISOString()

  return <main><section className="admin-page">
    <div className="email-admin-hero"><div><p className="eyebrow">SCENTMARKED ADMIN</p><h1>Email Marketing</h1><p>Create campaigns, organize audiences and monitor email performance.</p></div><div className="email-hero-actions"><Link className="button ghost" href="/admin">← Admin</Link><a className="button" href="#new-campaign">+ New campaign</a></div></div>
    <nav className="email-workspaces" aria-label="Email marketing tools"><a href="#new-campaign"><span>CREATE</span><strong>New campaign</strong><small>Start a new email draft</small></a><Link href="/admin/email/templates"><span>DESIGN</span><strong>Templates</strong><small>{templateRows.length} reusable designs</small></Link><Link href="/admin/email/segments"><span>AUDIENCE</span><strong>Segments</strong><small>{segmentRows.length} saved audiences</small></Link><Link href="/admin/crm"><span>CRM</span><strong>Contacts</strong><small>{emailableCountUnavailable?'Subscriber count unavailable':`${emailable} currently emailable`}</small></Link></nav>
    {p.error&&<div className="notice error" role="alert">{p.error}</div>}
    {error&&<div className="notice error" role="alert">Campaign data could not be loaded. Apply the CRM/email migration before using this page.</div>}
    {completedCampaignsAreRecentOnly&&<div className="notice error" role="alert">Completed campaign total could not be retrieved; showing a count from the recent list only.</div>}
    {campaignTotalUnavailable&&!error&&<div className="notice error" role="alert">Full campaign total is unavailable; showing recent campaigns only.</div>}
    {emailableCountUnavailable&&<div className="notice error" role="alert">Eligible subscriber count could not be retrieved. Verify CRM permissions and database availability.</div>}
    {deliveryMetricsError&&<div className="notice error" role="alert">Some delivery counts could not be loaded; performance metrics may be incomplete.</div>}
    <div className="notice"><strong>Provider-gated sending:</strong> Campaigns can send only when the Resend environment variables are configured. Consent checks, unsubscribe processing, and verified webhook handling remain enforced.</div>

    {!deliveryMetricsError&&<div className="admin-grid">
      <article className="admin-card"><p className="eyebrow">EMAILABLE</p><h2>{emailableCountUnavailable?'—':emailable}</h2><p>Active contacts with recorded consent</p></article>
      <article className="admin-card"><p className="eyebrow">SENT</p><h2>{sent}</h2><p>Accepted for sending or later confirmed</p></article>
      <article className="admin-card"><p className="eyebrow">DELIVERED</p><h2>{delivered}</h2><p>{pct(delivered,attempted)}% of attempted</p></article>
      <article className="admin-card"><p className="eyebrow">OPENED</p><h2>{opened}</h2><p>{pct(opened,delivered)}% of delivered</p></article>
      <article className="admin-card"><p className="eyebrow">CLICKED</p><h2>{clicked}</h2><p>{pct(clicked,delivered)}% of delivered</p></article>
    </div>}

    {!deliveryMetricsError&&<article className="admin-card email-performance"><p className="eyebrow">EMAIL HEALTH</p><h2>Overall performance</h2><p>Current delivery status totals across all campaigns · refreshed {new Date(metricsUpdatedAt).toLocaleString('en-US',{timeZone:'UTC',timeZoneName:'short'})}</p>
      <div className="admin-grid">
        <div><strong>{sent}</strong><p>Sent or later confirmed</p></div>
        <div><strong>{pct(delivered,attempted)}%</strong><p>Delivery rate · {delivered}/{attempted}</p></div>
        <div><strong>{pct(opened,delivered)}%</strong><p>Open rate · {opened}/{delivered}</p></div>
        <div><strong>{pct(clicked,delivered)}%</strong><p>Click rate · {clicked}/{delivered}</p></div>
        <div><strong>{pct(bounced,attempted)}%</strong><p>Bounce rate · {bounced}/{attempted}</p></div>
        <div><strong>{pct(complained,attempted)}%</strong><p>Spam complaint rate · {complained}/{attempted}</p></div>
        <div><strong>{pct(unsubscribed,attempted)}%</strong><p>Unsubscribe rate · {unsubscribed}/{attempted}</p></div>
        <div><strong>{pending}</strong><p>Queued or processing</p></div>
        <div><strong>{failed}</strong><p>Failed deliveries</p></div>
        <div><strong>{skipped}</strong><p>Skipped · no email sent</p></div>
        <div><strong>{unsubscribed}</strong><p>Unsubscribes</p></div>
        <div><strong>{complained}</strong><p>Spam complaints</p></div>
        <div><strong>{totalCampaigns??campaignCount}</strong><p>{campaignTotalUnavailable?'Recent campaigns':'Total campaigns'}</p></div>
        <div><strong>{completedCampaigns}</strong><p>{completedCampaignsAreRecentOnly?'Completed in recent list':'Completed campaigns'}</p></div>
      </div>
    </article>}

    <article className="admin-card email-create-card" id="new-campaign"><div className="email-section-heading"><div><p className="eyebrow">NEW CAMPAIGN</p><h2>Create a draft</h2><p>Give the campaign a working name and subject. You can choose or change the audience later.</p></div></div><form action={createCampaign} className="email-create-form"><label>Campaign name<input name="name" maxLength={120} placeholder="October Gourmand Finds" required/></label><label>Email subject<input name="subject" maxLength={200} placeholder="Sweet new scents picked for you" required/></label><label>Audience segment<select name="segment_id" defaultValue=""><option value="">Choose later</option>{segmentRows.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><div><button type="submit">Create draft</button></div></form></article>

    <div className="email-section-heading"><div><p className="eyebrow">CAMPAIGNS</p><h2>Campaigns</h2><p>Showing {campaignStart}–{campaignEnd}{typeof totalCampaigns==='number'?` of ${totalCampaigns}`:''} campaigns, newest first. Open a campaign to edit content, audience, scheduling or review delivery performance.</p>{campaignListTruncated&&<p>Use Next page to browse older campaigns.</p>}</div></div>
    {!campaignRows.length?<div className="empty-state"><h2>No campaigns yet.</h2><p>Create your first draft above.</p></div>:<div className="admin-list">{campaignRows.map((c:any)=>{const segment=Array.isArray(c.crm_segments)?c.crm_segments[0]:c.crm_segments;return <article className="admin-card email-campaign-row" key={c.id}><div><div className="email-campaign-meta"><span className={'email-status '+c.status}>{c.status}</span>{segment&&<span>{segment.name}</span>}</div><h2>{c.name}</h2><p>{c.subject}</p><small>Created {new Date(c.created_at).toLocaleDateString()}{c.scheduled_at?' · Scheduled '+new Date(c.scheduled_at).toLocaleString():''}</small></div><Link className="button ghost" href={'/admin/email/'+c.id}>Open campaign</Link></article>})}</div>}

    {!error&&<nav aria-label="Email campaign pages" style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}>{page>1&&<Link className="button ghost" href={'/admin/email?page='+(page-1)}>Previous page</Link>}<span>Page {page}{totalPages!==null?` of ${totalPages}`:''}</span>{(totalPages!==null?page<totalPages:campaignRows.length===pageSize)&&<Link className="button ghost" href={'/admin/email?page='+(page+1)}>Next page</Link>}</nav>}
  </section></main>
}
