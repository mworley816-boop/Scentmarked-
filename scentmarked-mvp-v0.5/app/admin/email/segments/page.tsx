import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'CRM Segments',robots:{index:false,follow:false}}

const fields=['loved_note','avoided_note','vibe','occasion','presentation','sweetness_min','projection_min','longevity_min','max_price'] as const

async function requireAdmin(){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent('/admin/email/segments'))
  const {data:p}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!p?.is_admin)redirect('/')
  return s
}

async function createSegment(formData:FormData){
  'use server'
  const s=await requireAdmin()
  const name=String(formData.get('name')||'').trim().slice(0,100)
  const description=String(formData.get('description')||'').trim().slice(0,300)
  const field=String(formData.get('field')||'')
  const value=String(formData.get('value')||'').trim().slice(0,100)
  if(!name)redirect('/admin/email/segments?error='+encodeURIComponent('Segment name is required.'))
  if(field&&!fields.includes(field as any))redirect('/admin/email/segments?error='+encodeURIComponent('Invalid segment rule.'))
  if(field&&!value)redirect('/admin/email/segments?error='+encodeURIComponent('Enter a value for the segment rule.'))
  const rules:any={contact:{status:'active',marketing_consent:true}}
  if(field)rules.profile={[field]:value}
  const {error}=await s.from('crm_segments').insert({name,description:description||null,rules,is_active:true})
  if(error)redirect('/admin/email/segments?error='+encodeURIComponent(error.code==='23505'?'A segment with that name already exists.':'Segment could not be created.'))
  redirect('/admin/email/segments')
}

async function toggleSegment(formData:FormData){
  'use server'
  const s=await requireAdmin()
  const id=Number(formData.get('id'))
  const active=String(formData.get('active'))==='true'
  if(!Number.isSafeInteger(id))redirect('/admin/email/segments')
  await s.from('crm_segments').update({is_active:active,updated_at:new Date().toISOString()}).eq('id',id)
  redirect('/admin/email/segments')
}

function ruleLabel(r:any){
  const p=r?.profile||{}
  const key=Object.keys(p)[0]
  const labels:any={loved_note:'Loves note',avoided_note:'Avoids note',vibe:'Vibe',occasion:'Occasion',presentation:'Presentation',sweetness_min:'Sweetness at least',projection_min:'Projection at least',longevity_min:'Longevity at least',max_price:'Budget up to'}
  return key?labels[key]+' '+p[key]:'All active, consented contacts'
}

export default async function Segments({searchParams}:{searchParams:Promise<{error?:string}>}){
  const p=await searchParams
  const s=await requireAdmin()
  const {data,error}=await s.from('crm_segments').select('id,name,description,rules,is_active,created_at,updated_at').order('name')

  return <main><section className="admin-page">
    <div className="admin-heading"><div><p className="eyebrow">ADMIN · CRM</p><h1>Audience Segments</h1><p>Build reusable audiences from email consent and ScentMarked taste signals.</p></div><Link className="button ghost" href="/admin/email">Back to Email</Link></div>
    {p.error&&<div className="notice error">{p.error}</div>}
    {error&&<div className="notice error">Segments could not be loaded.</div>}

    <article className="admin-card"><p className="eyebrow">NEW SEGMENT</p><h2>Create an audience</h2><p>Every email segment automatically requires an active CRM contact with marketing consent.</p>
      <form action={createSegment} style={{display:'grid',gap:12}}>
        <label>Name<input name="name" maxLength={100} placeholder="Vanilla Lovers" required/></label>
        <label>Description<input name="description" maxLength={300} placeholder="Members who love vanilla"/></label>
        <label>Scent rule<select name="field" defaultValue=""><option value="">No scent rule — all consented contacts</option><option value="loved_note">Loved note</option><option value="avoided_note">Avoided note</option><option value="vibe">Vibe</option><option value="occasion">Occasion</option><option value="presentation">Presentation</option><option value="sweetness_min">Minimum sweetness (1–5)</option><option value="projection_min">Minimum projection (1–5)</option><option value="longevity_min">Minimum longevity (1–5)</option><option value="max_price">Maximum budget</option></select></label>
        <label>Rule value<input name="value" maxLength={100} placeholder="Vanilla, Cozy & Comforting, 4, 100…"/></label>
        <div><button type="submit">Create segment</button></div>
      </form>
    </article>

    {!data?.length?<div className="empty-state"><h2>No audience segments yet.</h2></div>:<div className="admin-list">{data.map((x:any)=><article className="admin-card" key={x.id}><div className="admin-heading"><div><p className="eyebrow">{x.is_active?'ACTIVE':'INACTIVE'}</p><h2>{x.name}</h2>{x.description&&<p>{x.description}</p>}<p><strong>Audience:</strong> {ruleLabel(x.rules)}</p><small>Consent required · Created {new Date(x.created_at).toLocaleDateString()}</small></div><form action={toggleSegment}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="active" value={String(!x.is_active)}/><button className="button ghost" type="submit">{x.is_active?'Deactivate':'Activate'}</button></form></div></article>)}</div>}
  </section></main>
}
