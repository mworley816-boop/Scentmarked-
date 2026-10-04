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

async function retryFailed(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const s=await requireAdmin('/admin/email/'+id)
  if(!id)redirect('/admin/email')
  const {data,error}=await s.rpc('retry_failed_email_deliveries',{p_campaign_id:id})
  if(error)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Failed recipients could not be prepared for retry.'))
  redirect('/admin/email/'+id+'?retried='+String(data||0))
}

async function sendCampaign(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const confirmation=String(formData.get('confirmation')||'').trim()
  const s=await requireAdmin('/admin/email/'+id)
  if(!id||confirmation!=='SEND')redirect('/admin/email/'+id+'?error='+encodeURIComponent('Type SEND to confirm this campaign.'))

  const {count,error:countError}=await s.from('email_deliveries').select('id',{count:'exact',head:true}).eq('campaign_id',id).eq('status','queued')
  if(countError||!count)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Prepare at least one eligible recipient before sending.'))

  const { sendQueuedCampaign }=await import('@/lib/email-queue')
  try{
    const result=await sendQueuedCampaign(s,id)
    redirect('/admin/email/'+id+'?sent='+result.sent+'&failed='+result.failed+'&skipped='+result.skipped)
  }catch(error){
    const message=error instanceof Error?error.message:'Campaign send failed.'
    redirect('/admin/email/'+id+'?error='+encodeURIComponent(message))
  }
}

async function scheduleCampaign(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const when=String(formData.get('scheduled_at')||'')
  const s=await requireAdmin('/admin/email/'+id)
  const date=new Date(when)
  if(!id||!when||Number.isNaN(date.getTime())||date.getTime()<=Date.now())redirect('/admin/email/'+id+'?error='+encodeURIComponent('Choose a future send date and time.'))
  const {error}=await s.rpc('schedule_email_campaign',{p_campaign_id:id,p_scheduled_at:date.toISOString()})
  if(error)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Campaign could not be scheduled. Prepare its audience first.'))
  redirect('/admin/email/'+id+'?scheduled=1')
}

async function cancelSchedule(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const s=await requireAdmin('/admin/email/'+id)
  const {error}=await s.rpc('cancel_scheduled_email_campaign',{p_campaign_id:id})
  if(error)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Schedule could not be cancelled.'))
  redirect('/admin/email/'+id+'?unscheduled=1')
}

async function prepareCampaign(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const s=await requireAdmin('/admin/email/'+id)
  if(!id)redirect('/admin/email')
  const {data,error}=await s.rpc('queue_email_campaign',{p_campaign_id:id})
  if(error)redirect('/admin/email/'+id+'?error='+encodeURIComponent('Campaign audience could not be prepared.'))
  redirect('/admin/email/'+id+'?queued='+String(data||0))
}

export default async function EditCampaign({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string,saved?:string,queued?:string,sent?:string,failed?:string,skipped?:string,retried?:string,scheduled?:string,unscheduled?:string}>}){
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
  let audiencePreview=0
  if(campaign.segment_id){
    const {data:previewCount}=await s.rpc('count_email_segment_audience',{p_segment_id:campaign.segment_id})
    audiencePreview=Number(previewCount)||0
  }else{
    const {count}=await s.from('crm_contacts').select('id',{count:'exact',head:true}).eq('status','active').eq('marketing_consent',true).not('marketing_consented_at','is',null).is('unsubscribed_at',null)
    audiencePreview=count||0
  }
  const total=rows.length
  const skipped=counts.skipped||0
  const sentBase=total-(counts.queued||0)-skipped
  const delivered=(counts.delivered||0)+(counts.opened||0)+(counts.clicked||0)
  const opened=(counts.opened||0)+(counts.clicked||0)
  const clicked=counts.clicked||0
  const bounced=counts.bounced||0
  const failed=counts.failed||0
  const unsubscribed=counts.unsubscribed||0
  const rate=(value:number,base:number)=>base>0?Math.round((value/base)*1000)/10:0

  return <main><section className="admin-page">
    <div className="admin-heading"><div><p className="eyebrow">ADMIN · EMAIL CAMPAIGN</p><h1>{campaign.name}</h1><p>{campaign.status} · Created {new Date(campaign.created_at).toLocaleDateString()}</p></div><Link className="button ghost" href="/admin/email">Back to Email</Link></div>
    {p.error&&<div className="notice error">{p.error}</div>}
    {p.saved&&<div className="notice">Draft saved.</div>}{p.queued!==undefined&&<div className="notice">Campaign audience prepared: {p.queued} new eligible recipient{p.queued==='1'?'':'s'} queued. No email has been sent.</div>}
    {p.sent!==undefined&&<div className="notice">Send finished: {p.sent} sent · {p.failed||'0'} failed · {p.skipped||'0'} skipped.</div>}
    {p.retried!==undefined&&<div className="notice">{p.retried} failed recipient{p.retried==='1'?'':'s'} prepared for retry.</div>}
    {p.scheduled&&<div className="notice">Campaign scheduled successfully.</div>}
    {p.unscheduled&&<div className="notice">Campaign schedule cancelled. It is a draft again.</div>}
    <div className="notice"><strong>Provider-gated sending.</strong> Campaign sending only works when the Resend environment variables are configured. Recipient consent is checked again immediately before each send.</div>

    <div className="admin-grid">
      <article className="admin-card"><p className="eyebrow">STATUS</p><h2>{campaign.status}</h2><p>{campaign.scheduled_at?'Scheduled '+new Date(campaign.scheduled_at).toLocaleString():'Not scheduled'}</p></article>
      <article className="admin-card"><p className="eyebrow">DELIVERIES</p><h2>{total}</h2><p>{delivered} delivered · {opened} opened · {clicked} clicked</p></article>
    </div>

    <article className="admin-card"><p className="eyebrow">CAMPAIGN ANALYTICS</p><h2>Performance</h2>
      <div className="admin-grid">
        <div><strong>{rate(delivered,sentBase)}%</strong><p>Delivery rate · {delivered}/{sentBase}</p></div>
        <div><strong>{rate(opened,delivered)}%</strong><p>Open rate · {opened}/{delivered}</p></div>
        <div><strong>{rate(clicked,delivered)}%</strong><p>Click rate · {clicked}/{delivered}</p></div>
        <div><strong>{rate(bounced,sentBase)}%</strong><p>Bounce rate · {bounced}/{sentBase}</p></div>
        <div><strong>{failed}</strong><p>Failed sends</p></div>
        <div><strong>{skipped}</strong><p>Skipped · no email sent</p></div>
        <div><strong>{unsubscribed}</strong><p>Unsubscribes</p></div>
      </div>
    </article>

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

    {editable&&<article className="admin-card"><p className="eyebrow">AUDIENCE PREPARATION</p><h2>{audiencePreview} currently eligible recipient{audiencePreview===1?'':'s'}</h2><p>{campaign.segment_id?'This preview uses the selected segment plus current marketing consent.':'No segment is selected, so this preview includes all currently active, explicitly consented contacts.'} Preparing creates queued delivery records only; it does not send email.</p><form action={prepareCampaign}><input type="hidden" name="id" value={id}/><button type="submit" disabled={audiencePreview===0}>Prepare audience</button></form></article>}

    {editable&&(counts.queued||0)>0&&<article className="admin-card"><p className="eyebrow">SCHEDULE CAMPAIGN</p><h2>Send later</h2><p>Choose a future date and time. The campaign remains queued until a trusted scheduled worker processes it.</p><form action={scheduleCampaign} style={{display:'grid',gap:12,maxWidth:420}}><input type="hidden" name="id" value={id}/><label>Send date and time<input type="datetime-local" name="scheduled_at" required/></label><button type="submit">Schedule campaign</button></form></article>}

    {campaign.status==='scheduled'&&<article className="admin-card"><p className="eyebrow">SCHEDULED</p><h2>{campaign.scheduled_at?new Date(campaign.scheduled_at).toLocaleString():'Scheduled campaign'}</h2><p>The campaign is waiting for its scheduled processing time.</p><form action={cancelSchedule}><input type="hidden" name="id" value={id}/><button className="button ghost" type="submit">Cancel schedule</button></form></article>}

    {editable&&(counts.queued||0)>0&&<article className="admin-card"><p className="eyebrow">SEND CAMPAIGN</p><h2>Send to {counts.queued} queued recipient{counts.queued===1?'':'s'}</h2><p>This action sends real email when the Resend provider is configured. Consent is checked again immediately before each message.</p><form action={sendCampaign} style={{display:'grid',gap:12,maxWidth:420}}><input type="hidden" name="id" value={id}/><label>Type SEND to confirm<input name="confirmation" autoComplete="off" required/></label><button type="submit">Send campaign</button></form></article>}

    {(counts.failed||0)>0&&<article className="admin-card"><p className="eyebrow">FAILED DELIVERIES</p><h2>{counts.failed} recipient{counts.failed===1?'':'s'} failed</h2><p>Requeue only failed recipients who are still eligible for marketing email. Successful recipients will not be sent again.</p><form action={retryFailed}><input type="hidden" name="id" value={id}/><button type="submit">Prepare failed recipients for retry</button></form></article>}

    <article className="admin-card"><p className="eyebrow">PREVIEW</p><h2>{campaign.subject}</h2>{campaign.preview_text&&<p>{campaign.preview_text}</p>}<div style={{border:'1px solid currentColor',borderRadius:12,padding:20,marginTop:12,background:'white',color:'black'}} dangerouslySetInnerHTML={{__html:campaign.html_body}}/></article>
  </section></main>
}
