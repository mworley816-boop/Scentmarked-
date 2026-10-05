import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Email Templates',robots:{index:false,follow:false}}

async function requireAdmin(){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent('/admin/email/templates'))
  const {data:p}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!p?.is_admin)redirect('/')
  return s
}

async function createTemplate(formData:FormData){
  'use server'
  const s=await requireAdmin()
  const name=String(formData.get('name')||'').trim().slice(0,100)
  const subject=String(formData.get('subject')||'').trim().slice(0,200)
  const preview=String(formData.get('preview_text')||'').trim().slice(0,240)
  if(!name||!subject)redirect('/admin/email/templates?error='+encodeURIComponent('Template name and subject are required.'))
  const html='<div style="max-width:640px;margin:0 auto;font-family:Arial,sans-serif;padding:32px 20px"><h1>ScentMarked</h1><p>Hi {{first_name}},</p><p>Write your email here.</p></div>'
  const text='ScentMarked\n\nHi {{first_name}},\n\nWrite your email here.'
  const {data,error}=await s.from('email_templates').insert({name,subject,preview_text:preview||null,html_body:html,text_body:text}).select('id').single()
  if(error||!data)redirect('/admin/email/templates?error='+encodeURIComponent(error?.code==='23505'?'A template with that name already exists.':'Template could not be created.'))
  redirect('/admin/email/templates/'+data.id)
}

export default async function Templates({searchParams}:{searchParams:Promise<{error?:string}>}){
  const p=await searchParams
  const s=await requireAdmin()
  const {data,error}=await s.from('email_templates').select('id,name,subject,preview_text,updated_at,created_at').order('updated_at',{ascending:false})
  const templateRows=data||[]
  return <main><section className="admin-page">
    <div className="email-subpage-hero"><div><p className="eyebrow">EMAIL MARKETING</p><h1>Email Templates</h1><p>Create reusable ScentMarked layouts for campaigns and future automations.</p></div><div><Link className="button ghost" href="/admin/email">← Email dashboard</Link></div></div>
    {p.error&&<div className="notice error">{p.error}</div>}
    {error&&<div className="notice error">Templates could not be loaded.</div>}
    <article className="admin-card email-create-card"><p className="eyebrow">NEW TEMPLATE</p><h2>Create a template</h2><p>Start with the standard ScentMarked email shell, then customize its content and design. The secure unsubscribe footer is added automatically at send time.</p><form action={createTemplate} className="template-create-form"><label>Template name<input name="name" maxLength={100} placeholder="ScentMarked Newsletter" required/></label><label>Default subject<input name="subject" maxLength={200} placeholder="Your ScentMarked picks are here" required/></label><label>Preview text<input name="preview_text" maxLength={240} placeholder="A few scents we think you'll love"/></label><div><button type="submit">Create template</button></div></form></article>
    {!templateRows.length?<div className="empty-state"><h2>No templates yet.</h2></div>:<div className="admin-list">{templateRows.map((x:any)=><article className="admin-card template-library-row" key={x.id}><div><p className="eyebrow">TEMPLATE</p><h2>{x.name}</h2><p>{x.subject}</p>{x.preview_text&&<small>{x.preview_text}</small>}<small className="template-updated">Updated {new Date(x.updated_at).toLocaleDateString()}</small></div><Link className="button ghost" href={'/admin/email/templates/'+x.id}>Open template</Link></article>)}</div>}
  </section></main>
}
