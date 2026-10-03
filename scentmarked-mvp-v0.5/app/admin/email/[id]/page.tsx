import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Edit Email Campaign',robots:{index:false,follow:false}}

async function requireAdmin(next:string){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent(next))
  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin)redirect('/')
  return s
}

async function saveCampaign(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const s=await requireAdmin('/admin/email/'+id)
  const name=String(formData.get('name')||'').trim().slice(0,120)
  const subject=String(formData.get('subject')||'').trim().slice(0,200)
  const previewText=String(formData.get('preview_text')||'').trim().slice(0,240)
  const htmlBody=String(formData.get('html_body')||'').trim()
  const textBody=String(formData.get('text_body')||'').trim()
  const segmentRaw=String(formData.get('segment_id')||'')
  const templateRaw=String(formData.get('template_id')||'')
  const segmentId=segmentRaw?Number(segmentRaw):null
  const templateId=templateRaw?Number(templateRaw):null
  if(!id||!name||!subject||!htmlBody)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Name, subject, and email content are required.'))
  if((segmentRaw&&!Number.isSafeInteger(segmentId))||(templateRaw&&!Number.isSafeInteger(templateId)))redirect('/admin/email/'+id+'?error='+encodeURIComponent('Invalid campaign selection.'))
  const {error}=await s.from('email_campaigns').update({
    name,subject,preview_text:previewText||null,html_body:htmlBody,text_body:textBody||null,
    segment_id:segmentId,template_id:templateId,updated_at:new Date().toISOString()
  }).eq('id',id).eq('status','draft')
  if(error)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Campaign could not be saved.'))
  redirect('/admin/email/'+id+'?saved=1')
}

export default async function EditCampaign({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string,saved?:string}>}){
  const {id}=await params
  const p=await searchParams
  const s=await requireAdmin('/admin/email/'+id)
  const [{data:c,error},{data:segments},{data:templates},{data:deliveryRows}]=await Promise.all([
    s.from('email_campaigns').select('id,name,subject,preview_text,html_body,text_body,status,segment_id,template_id,scheduled_at,started_at,completed_at,created_at,updated_at').eq('id',id).maybeSingle(),
    s.from('crm_segments').select('id,name,is_active').eq('is_active',true).order('name'),
    s.from('email_templates').select('id,name,subject').order('name'),
    s.from('email_deliveries').select('status').eq('campaign_id',id)
  ])
  if(error||!c)notFound()
  const campaign=c as any
  const rows=deliveryRows||[]
  const counts=rows.reduce((a:any,x:any)=>{a[x.status]=(a[x.status]||0)+1;return a},{})
  const editable=campaign.status==='draft'

  return <main><section className="admin-page">
    <div className="admin-heading"><div><p className="eyebrow">ADMIN · EMAIL CAMPAIGN</p><h1>{campaign.name}</h1><p>{campaign.status} · Created {new Date(campaign.created_at).toLocaleDateString()}</p></div><Link className="button ghost" href="/admin/email">Back to Email</Link></div>
    {p.error&&<div className="notice error">{p.error}</div>}
    {p.saved&&<div className="notice">Draft saved.</div>}
    <div className="notice"><strong>Sending is locked.</strong> This editor can prepare campaigns, but no send or schedule action is exposed until the email provider, unsubscribe endpoint, and webhook verification are complete.</div>

    <div className="admin-grid">
      <article className="admin-card"><p className="eyebrow">STATUS</p><h2>{campaign.status}</h2><p>{campaign.scheduled_at?'Scheduled '+new Date(campaign.scheduled_at).toLocaleString():'Not scheduled'}</p></article>
      <article className="admin-card"><p className="eyebrow">DELIVERIES</p><h2>{rows.length}</h2><p>{counts.delivered||0} delivered · {counts.opened||0} opened · {counts.clicked||0} clicked</p></article>
    </div>

    <form action={saveCampaign} style={{display:'grid',gap:16}}>
      <input type="hidden" name="id" value={id}/>
      <article className="admin-card"><p className="eyebrow">SETUP</p><h2>Campaign details</h2>
        <label>Campaign name<input name="name" maxLength={120} defaultValue={campaign.name} disabled={!editable} required/></label>
        <label>Subject<input name="subject" maxLength={200} defaultValue={campaign.subject} disabled={!editable} required/></label>
        <label>Preview text<input name="preview_text" maxLength={240} defaultValue={campaign.preview_text||''} disabled={!editable} placeholder="Short inbox preview"/></label>
        <label>Audience<select name="segment_id" defaultValue={campaign.segment_id||''} disabled={!editable}><option value="">Choose a segment</option>{segments?.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Template<select name="template_id" defaultValue={campaign.template_id||''} disabled={!editable}><option value="">No linked template</option>{templates?.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      </article>

      <article className="admin-card"><p className="eyebrow">CONTENT</p><h2>Email body</h2>
        <label>HTML<textarea name="html_body" rows={18} defaultValue={campaign.html_body} disabled={!editable} required/></label>
        <label>Plain text<textarea name="text_body" rows={10} defaultValue={campaign.text_body||''} disabled={!editable} placeholder="Accessible plain-text version"/></label>
        {editable&&<button type="submit">Save draft</button>}
      </article>
    </form>

    <article className="admin-card"><p className="eyebrow">PREVIEW</p><h2>{campaign.subject}</h2>{campaign.preview_text&&<p>{campaign.preview_text}</p>}<div style={{border:'1px solid currentColor',borderRadius:12,padding:20,marginTop:12,background:'white',color:'black'}} dangerouslySetInnerHTML={{__html:campaign.html_body}}/></article>
  </section></main>
}
