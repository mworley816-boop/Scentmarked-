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
  const submitted=fields.map(field=>({field,value:String(formData.get(field)||'').trim().slice(0,100)})).filter(x=>x.value)
  if(!name)redirect('/admin/email/segments?error='+encodeURIComponent('Segment name is required.'))
  const rules:any={contact:{status:'active',marketing_consent:true},profile:{}}
  for(const {field,value} of submitted)rules.profile[field]=value
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
  const labels:any={loved_note:'Loves note',avoided_note:'Avoids note',vibe:'Vibe',occasion:'Occasion',presentation:'Presentation',sweetness_min:'Sweetness at least',projection_min:'Projection at least',longevity_min:'Longevity at least',max_price:'Budget up to'}
  const parts=Object.entries(p).filter(([key])=>labels[key]).map(([key,value])=>labels[key]+' '+value)
  return parts.length?parts.join(' · '):'All active, consented contacts'
}

export default async function Segments({searchParams}:{searchParams:Promise<{error?:string}>}){
  const p=await searchParams
  const s=await requireAdmin()
  const {data,error}=await s.from('crm_segments').select('id,name,description,rules,is_active,created_at,updated_at').order('name')
  const audienceCounts=new Map<number,number>()
  await Promise.all((data||[]).filter((x:any)=>x.is_active).map(async(x:any)=>{
    const {data:count}=await s.rpc('count_email_segment_audience',{p_segment_id:x.id})
    audienceCounts.set(x.id,Number(count)||0)
  }))

  return <main><section className="admin-page">
    <div className="admin-heading"><div><p className="eyebrow">ADMIN · CRM</p><h1>Audience Segments</h1><p>Build reusable audiences from email consent and ScentMarked taste signals.</p></div><Link className="button ghost" href="/admin/email">Back to Email</Link></div>
    {p.error&&<div className="notice error">{p.error}</div>}
    {error&&<div className="notice error">Segments could not be loaded.</div>}

    <article className="admin-card"><p className="eyebrow">NEW SEGMENT</p><h2>Create an audience</h2><p>Every email segment automatically requires an active CRM contact with marketing consent.</p>
      <form action={createSegment} style={{display:'grid',gap:12}}>
        <label>Name<input name="name" maxLength={100} placeholder="Vanilla Lovers" required/></label>
        <label>Description<input name="description" maxLength={300} placeholder="Members who love vanilla"/></label>
        <p>Add any conditions you need. Blank fields are ignored, and all completed conditions must match.</p>
        <div className="admin-grid">
          <label>Loved note or family<input name="loved_note" maxLength={100} placeholder="Vanilla or Gourmand"/></label>
          <label>Avoided note<input name="avoided_note" maxLength={100} placeholder="Oud"/></label>
          <label>Vibe<input name="vibe" maxLength={100} placeholder="Cozy & Comforting"/></label>
          <label>Occasion<input name="occasion" maxLength={100} placeholder="Date Night"/></label>
          <label>Presentation<input name="presentation" maxLength={100} placeholder="Unisex / Gender-neutral"/></label>
          <label>Minimum sweetness<input name="sweetness_min" type="number" min="1" max="5" step="1"/></label>
          <label>Minimum projection<input name="projection_min" type="number" min="1" max="5" step="1"/></label>
          <label>Minimum longevity<input name="longevity_min" type="number" min="1" max="5" step="1"/></label>
          <label>Maximum budget<input name="max_price" type="number" min="1" step="1" placeholder="100"/></label>
        </div>
        <div><button type="submit">Create segment</button></div>
      </form>
    </article>

    {!data?.length?<div className="empty-state"><h2>No audience segments yet.</h2></div>:<div className="admin-list">{data.map((x:any)=><article className="admin-card" key={x.id}><div className="admin-heading"><div><p className="eyebrow">{x.is_active?'ACTIVE':'INACTIVE'}</p><h2>{x.name}</h2>{x.description&&<p>{x.description}</p>}<p><strong>Audience:</strong> {ruleLabel(x.rules)}</p><p><strong>Current eligible audience:</strong> {x.is_active?(audienceCounts.get(x.id)||0):'Inactive'}</p><small>Consent required · Created {new Date(x.created_at).toLocaleDateString()}</small></div><form action={toggleSegment}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="active" value={String(!x.is_active)}/><button className="button ghost" type="submit">{x.is_active?'Deactivate':'Activate'}</button></form></div></article>)}</div>}
  </section></main>
}
