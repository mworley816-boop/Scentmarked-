import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Edit Email Template',robots:{index:false,follow:false}}

async function requireAdmin(id:string){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent('/admin/email/templates/'+id))
  const {data:p}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!p?.is_admin)redirect('/')
  return s
}

async function saveTemplate(formData:FormData){
  'use server'
  const id=String(formData.get('id')||'')
  const s=await requireAdmin(id)
  const name=String(formData.get('name')||'').trim().slice(0,100)
  const subject=String(formData.get('subject')||'').trim().slice(0,200)
  const preview=String(formData.get('preview_text')||'').trim().slice(0,240)
  const html=String(formData.get('html_body')||'').trim()
  const text=String(formData.get('text_body')||'').trim()
  if(!name||!subject||!html)redirect('/admin/email/templates/'+id+'?error='+encodeURIComponent('Name, subject, and HTML are required.'))
  if(html.includes('{{unsubscribe_url}}')||text.includes('{{unsubscribe_url}}'))redirect('/admin/email/templates/'+id+'?error='+encodeURIComponent('Remove {{unsubscribe_url}} from the template. ScentMarked adds the secure unsubscribe footer automatically when email is sent.'))
  const {error}=await s.from('email_templates').update({name,subject,preview_text:preview||null,html_body:html,text_body:text||null,updated_at:new Date().toISOString()}).eq('id',id)
  if(error)redirect('/admin/email/templates/'+id+'?error='+encodeURIComponent('Template could not be saved.'))
  redirect('/admin/email/templates/'+id+'?saved=1')
}

export default async function EditTemplate({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string,saved?:string}>}){
  const {id}=await params
  const p=await searchParams
  const s=await requireAdmin(id)
  const {data,error}=await s.from('email_templates').select('id,name,subject,preview_text,html_body,text_body,created_at,updated_at').eq('id',Number(id)).maybeSingle()
  if(error||!data)notFound()
  const t:any=data
  const hasPlainText=Boolean(String(t.text_body||'').trim())
  const usesFirstName=[t.subject,t.preview_text,t.html_body,t.text_body].some(value=>String(value||'').includes('{{first_name}}'))
  return <main><section className="admin-page">
    <div className="email-subpage-hero"><div><p className="eyebrow">EMAIL · TEMPLATE</p><h1>{t.name}</h1><p>Reusable campaign layout · Updated {new Date(t.updated_at).toLocaleString()}</p></div><div className="campaign-editor-actions"><Link className="button ghost" href="/admin/email/templates">← Templates</Link><a className="button ghost" href="#template-preview">Preview</a></div></div>
    {p.error&&<div className="notice error">{p.error}</div>}{p.saved&&<div className="notice">Template saved.</div>}
    <div className="notice"><strong>Automatic compliance footer:</strong> Do not add an unsubscribe placeholder manually. ScentMarked appends the secure per-contact unsubscribe link when each marketing email is sent.</div>
    <article className="admin-card template-readiness-card"><p className="eyebrow">TEMPLATE GUIDE</p><h2>Personalization & fallback</h2><div className="admin-grid"><div><strong>{usesFirstName?'✓':'○'} First-name personalization</strong><p>Use <code>{'{{first_name}}'}</code> anywhere in the subject, preview text, HTML, or plain text. It is optional.</p></div><div><strong>{hasPlainText?'✓':'○'} Plain-text fallback</strong><p>{hasPlainText?'A plain-text version is saved.':'Recommended for accessibility and clients that cannot display HTML.'}</p></div><div><strong>✓ Unsubscribe footer</strong><p>Added securely for each recipient at send time. Do not place an unsubscribe token in this template.</p></div></div></article>
    <form action={saveTemplate} className="template-editor-form"><input type="hidden" name="id" value={id}/>
      <article className="admin-card template-details-card"><p className="eyebrow">SETUP</p><h2>Template details</h2><label>Name<input name="name" maxLength={100} defaultValue={t.name} required/></label><label>Default subject<input name="subject" maxLength={200} defaultValue={t.subject} required/></label><label>Preview text<input name="preview_text" maxLength={240} defaultValue={t.preview_text||''}/></label></article>
      <article className="admin-card template-content-card"><p className="eyebrow">CONTENT</p><h2>Email body</h2><label>HTML<textarea name="html_body" rows={20} defaultValue={t.html_body} required/></label><label>Plain text<textarea name="text_body" rows={10} defaultValue={t.text_body||''}/></label><button type="submit">Save template</button></article>
    </form>
    <article className="admin-card campaign-preview-card" id="template-preview"><p className="eyebrow">PREVIEW</p><h2>{t.subject}</h2>{t.preview_text&&<p>{t.preview_text}</p>}<div style={{border:'1px solid currentColor',borderRadius:12,padding:20,marginTop:12,background:'white',color:'black'}} dangerouslySetInnerHTML={{__html:t.html_body}}/></article>
  </section></main>
}
