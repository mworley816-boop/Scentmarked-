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

export default async function AdminEmail({searchParams}:{searchParams:Promise<{error?:string}>}){
  const p=await searchParams
  const {s}=await requireAdmin()

  const [{data:campaigns,error},{data:segments},{data:templates},{data:deliveries},{count:emailable}]=await Promise.all([
    s.from('email_campaigns').select('id,name,subject,status,scheduled_at,started_at,completed_at,created_at,crm_segments:segment_id(id,name)').order('created_at',{ascending:false}).limit(100),
    s.from('crm_segments').select('id,name,is_active').eq('is_active',true).order('name'),
    s.from('email_templates').select('id,name,subject,updated_at').order('updated_at',{ascending:false}).limit(50),
    s.from('email_deliveries').select('status'),
    s.from('crm_contacts').select('*',{count:'exact',head:true}).eq('status','active').eq('marketing_consent',true)
  ])

  const campaignRows=campaigns||[]
  const segmentRows=segments||[]
  const templateRows=templates||[]
  const ds=deliveries||[]
  const sent=ds.filter((x:any)=>['sent','delivered','opened','clicked'].includes(x.status)).length
  const delivered=ds.filter((x:any)=>['delivered','opened','clicked'].includes(x.status)).length
  const opened=ds.filter((x:any)=>['opened','clicked'].includes(x.status)).length
  const clicked=ds.filter((x:any)=>x.status==='clicked').length
  const bounced=ds.filter((x:any)=>x.status==='bounced').length
  const failed=ds.filter((x:any)=>x.status==='failed').length
  const complained=ds.filter((x:any)=>x.status==='complained').length
  const unsubscribed=ds.filter((x:any)=>x.status==='unsubscribed').length
  const skipped=ds.filter((x:any)=>x.status==='skipped').length
  const attempted=ds.filter((x:any)=>!['queued','skipped'].includes(x.status)).length
  const campaignCount=campaignRows.length
  const completedCampaigns=campaignRows.filter((x:any)=>x.status==='sent').length
  const pct=(n:number,d:number)=>d?Math.round(n/d*1000)/10:0

  return <main><section className="admin-page">
    <div className="email-admin-hero"><div><p className="eyebrow">SCENTMARKED ADMIN</p><h1>Email Marketing</h1><p>Create campaigns, organize audiences and monitor email performance.</p></div><div className="email-hero-actions"><Link className="button ghost" href="/admin">← Admin</Link><a className="button" href="#new-campaign">+ New campaign</a></div></div>
    <nav className="email-workspaces" aria-label="Email marketing tools"><a href="#new-campaign"><span>CREATE</span><strong>New campaign</strong><small>Start a new email draft</small></a><Link href="/admin/email/templates"><span>DESIGN</span><strong>Templates</strong><small>{templateRows.length} reusable designs</small></Link><Link href="/admin/email/segments"><span>AUDIENCE</span><strong>Segments</strong><small>{segmentRows.length} saved audiences</small></Link><Link href="/admin/crm"><span>CRM</span><strong>Contacts</strong><small>{emailable||0} currently emailable</small></Link></nav>
    {p.error&&<div className="notice error" role="alert">{p.error}</div>}
    {error&&<div className="notice error" role="alert">Campaign data could not be loaded. Apply the CRM/email migration before using this page.</div>}
    <div className="notice"><strong>Provider-gated sending:</strong> Campaigns can send only when the Resend environment variables are configured. Consent checks, unsubscribe processing, and verified webhook handling remain enforced.</div>

    <div className="admin-grid">
      <article className="admin-card"><p className="eyebrow">EMAILABLE</p><h2>{emailable||0}</h2><p>Active contacts with consent</p></article>
      <article className="admin-card"><p className="eyebrow">DELIVERED</p><h2>{delivered}</h2><p>{pct(delivered,attempted)}% of attempted</p></article>
      <article className="admin-card"><p className="eyebrow">OPENED</p><h2>{opened}</h2><p>{pct(opened,delivered)}% of delivered</p></article>
      <article className="admin-card"><p className="eyebrow">CLICKED</p><h2>{clicked}</h2><p>{pct(clicked,delivered)}% of delivered</p></article>
    </div>

    <article className="admin-card email-performance"><p className="eyebrow">EMAIL HEALTH</p><h2>Overall performance</h2>
      <div className="admin-grid">
        <div><strong>{pct(delivered,attempted)}%</strong><p>Delivery rate · {delivered}/{attempted}</p></div>
        <div><strong>{pct(opened,delivered)}%</strong><p>Open rate · {opened}/{delivered}</p></div>
        <div><strong>{pct(clicked,delivered)}%</strong><p>Click rate · {clicked}/{delivered}</p></div>
        <div><strong>{pct(bounced,attempted)}%</strong><p>Bounce rate · {bounced}/{attempted}</p></div>
        <div><strong>{failed}</strong><p>Failed deliveries</p></div>
        <div><strong>{skipped}</strong><p>Skipped · no email sent</p></div>
        <div><strong>{unsubscribed}</strong><p>Unsubscribes</p></div>
        <div><strong>{complained}</strong><p>Spam complaints</p></div>
        <div><strong>{campaignCount}</strong><p>Recent campaigns</p></div>
        <div><strong>{completedCampaigns}</strong><p>Completed campaigns</p></div>
      </div>
    </article>

    <article className="admin-card email-create-card" id="new-campaign"><div className="email-section-heading"><div><p className="eyebrow">NEW CAMPAIGN</p><h2>Create a draft</h2><p>Give the campaign a working name and subject. You can choose or change the audience later.</p></div></div><form action={createCampaign} className="email-create-form"><label>Campaign name<input name="name" maxLength={120} placeholder="October Gourmand Finds" required/></label><label>Email subject<input name="subject" maxLength={200} placeholder="Sweet new scents picked for you" required/></label><label>Audience segment<select name="segment_id" defaultValue=""><option value="">Choose later</option>{segmentRows.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><div><button type="submit">Create draft</button></div></form></article>

    <div className="email-section-heading"><div><p className="eyebrow">CAMPAIGNS</p><h2>Recent campaigns</h2><p>Open a campaign to edit content, audience, scheduling or review delivery performance.</p></div></div>
    {!campaignRows.length?<div className="empty-state"><h2>No campaigns yet.</h2><p>Create your first draft above.</p></div>:<div className="admin-list">{campaignRows.map((c:any)=>{const segment=Array.isArray(c.crm_segments)?c.crm_segments[0]:c.crm_segments;return <article className="admin-card email-campaign-row" key={c.id}><div><div className="email-campaign-meta"><span className={'email-status '+c.status}>{c.status}</span>{segment&&<span>{segment.name}</span>}</div><h2>{c.name}</h2><p>{c.subject}</p><small>Created {new Date(c.created_at).toLocaleDateString()}{c.scheduled_at?' · Scheduled '+new Date(c.scheduled_at).toLocaleString():''}</small></div><Link className="button ghost" href={'/admin/email/'+c.id}>Open campaign</Link></article>})}</div>}

  </section></main>
}
