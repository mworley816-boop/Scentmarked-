import Link from 'next/link'
import { notFound,redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Edit CRM Segment',robots:{index:false,follow:false}}

const multiFields=['loved_note','avoided_note','vibe','occasion','presentation'] as const
const scentFamilies=['Gourmand','Fruity','Floral','Fresh','Citrus','Woody','Amber','Spicy','Musky','Aquatic','Green','Smoky']
const scentNotes=['Vanilla','Marshmallow','Caramel','Strawberry','Cherry','Peach','Mango','Pear','Coconut','Chocolate','Coffee','Praline','Rose','Jasmine','Orange Blossom','Bergamot','Lemon','Sandalwood','Oud','Musk','Amber','Patchouli']
const scentChoices=[...scentFamilies,...scentNotes]
const vibes=['Cozy & Comforting','Sexy & Seductive','Clean & Polished','Playful & Sweet','Elegant & Sophisticated','Bold & Mysterious','Fresh & Energetic','Dark & Luxurious']
const occasions=['Everyday','Work or School','Date Night','Going Out','Special Occasions','Cozy at Home','Vacation or Summer','Cold Weather']
const presentations=['Feminine-leaning','Masculine-leaning','Unisex / Gender-neutral','No preference']
const choices:Record<string,string[]>={loved_note:scentChoices,avoided_note:scentNotes,vibe:vibes,occasion:occasions,presentation:presentations}

async function requireAdmin(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login')
 const {data:p}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(!p?.is_admin)redirect('/')
 return s
}
function valuesOf(profile:any,key:string){const v=profile?.[key];return Array.isArray(v)?v:v?[String(v)]:[]}

export default async function EditSegment({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string}>}){
 const {id}=await params,p=await searchParams
 const segmentId=Number(id)
 if(!Number.isSafeInteger(segmentId))notFound()
 const s=await requireAdmin()
 const {data:segment}=await s.from('crm_segments').select('id,name,description,rules,is_active').eq('id',segmentId).maybeSingle()
 if(!segment)notFound()
 const [{count:campaignCount},{data:audienceCount},{data:audiencePreview}]=await Promise.all([
  s.from('email_campaigns').select('id',{count:'exact',head:true}).eq('segment_id',segmentId),
  segment.is_active?s.rpc('count_email_segment_audience',{p_segment_id:segmentId}):Promise.resolve({data:0}),
  segment.is_active?s.rpc('preview_email_segment_audience',{p_segment_id:segmentId,p_limit:25}):Promise.resolve({data:[] as any[]})
 ])
 const profile:any=segment.rules?.profile||{},modes:any=segment.rules?.match_modes||{}

 async function save(formData:FormData){
  'use server'
  const db=await requireAdmin()
  const name=String(formData.get('name')||'').trim().slice(0,100)
  const description=String(formData.get('description')||'').trim().slice(0,300)
  if(!name)redirect('/admin/email/segments/'+segmentId+'?error='+encodeURIComponent('Segment name is required.'))
  const next:any={contact:{status:'active',marketing_consent:true},profile:{},match_modes:{}}
  for(const field of multiFields){
   const allowed=choices[field],vals=[...new Set(formData.getAll(field).map(String).filter(x=>allowed.includes(x)))]
   if(vals.length){next.profile[field]=vals;next.match_modes[field]=String(formData.get(field+'_mode'))==='any'?'any':'all'}
  }
  for(const field of ['sweetness_min','projection_min','longevity_min']){
   const raw=String(formData.get(field)||'')
   if(raw){const n=Number(raw);if(!Number.isInteger(n)||n<1||n>5)redirect('/admin/email/segments/'+segmentId+'?error='+encodeURIComponent('Trait thresholds must be from 1 to 5.'));next.profile[field]=raw}
  }
  const budget=String(formData.get('max_price')||'')
  if(budget){const n=Number(budget);if(!Number.isSafeInteger(n)||n<1)redirect('/admin/email/segments/'+segmentId+'?error='+encodeURIComponent('Maximum budget must be a positive whole number.'));next.profile.max_price=budget}
  const {error}=await db.from('crm_segments').update({name,description:description||null,rules:next,updated_at:new Date().toISOString()}).eq('id',segmentId)
  if(error)redirect('/admin/email/segments/'+segmentId+'?error='+encodeURIComponent(error.code==='23505'?'A segment with that name already exists.':'Segment could not be saved.'))
  redirect('/admin/email/segments')
 }

 async function remove(formData:FormData){
  'use server'
  const confirmation=String(formData.get('confirmation')||'').trim()
  if(confirmation!=='DELETE')redirect('/admin/email/segments/'+segmentId+'?error='+encodeURIComponent('Type DELETE to confirm permanent deletion.'))
  const db=await requireAdmin()
  const {data,error}=await db.rpc('delete_unused_crm_segment',{p_segment_id:segmentId})
  if(error||!data)redirect('/admin/email/segments/'+segmentId+'?error='+encodeURIComponent(error?.message||'Segment could not be deleted.'))
  redirect('/admin/email/segments')
 }

 return <main><section className="admin-page">
  <div className="admin-heading"><div><p className="eyebrow">ADMIN · CRM</p><h1>Edit {segment.name}</h1><p>Update this reusable audience. Email consent remains required automatically.</p></div><Link className="button ghost" href="/admin/email/segments">Back to Segments</Link></div>
  {p.error&&<div className="notice error">{p.error}</div>}
  <article className="admin-card"><form action={save} style={{display:'grid',gap:12}}>
   <label>Name<input name="name" defaultValue={segment.name} maxLength={100} required/></label>
   <label>Description<input name="description" defaultValue={segment.description||''} maxLength={300}/></label>
   {multiFields.map(field=><fieldset key={field}><legend>{field.replaceAll('_',' ')}</legend><label>Match<select name={field+'_mode'} defaultValue={modes[field]==='any'?'any':'all'}><option value="all">ALL checked values</option><option value="any">ANY checked value</option></select></label><div className="quiz-check-grid">{choices[field].map(x=><label className="quiz-check" key={field+x}><input type="checkbox" name={field} value={x} defaultChecked={valuesOf(profile,field).includes(x)}/><span>{x}</span></label>)}</div></fieldset>)}
   <div className="admin-grid">
    <label>Minimum sweetness<input name="sweetness_min" type="number" min="1" max="5" step="1" defaultValue={profile.sweetness_min||''}/></label>
    <label>Minimum projection<input name="projection_min" type="number" min="1" max="5" step="1" defaultValue={profile.projection_min||''}/></label>
    <label>Minimum longevity<input name="longevity_min" type="number" min="1" max="5" step="1" defaultValue={profile.longevity_min||''}/></label>
    <label>Maximum budget<input name="max_price" type="number" min="1" step="1" defaultValue={profile.max_price||''}/></label>
   </div>
   <div><button type="submit">Save segment</button></div>
  </form></article>
  <article className="admin-card"><p className="eyebrow">AUDIENCE PREVIEW</p><h2>{segment.is_active?(Number(audienceCount)||0)+' eligible contact'+(Number(audienceCount)===1?'':'s'):'Segment inactive'}</h2><p>Only active contacts with marketing consent are included. Showing up to 25 matching names.</p>{segment.is_active&&!audiencePreview?.length?<p>No contacts currently match this segment.</p>:<div className="admin-list">{(audiencePreview||[]).map((contact:any)=><div key={contact.contact_id}>{[contact.first_name,contact.last_name].filter(Boolean).join(' ')||'Unnamed contact'}</div>)}</div>}</article>
  <article className="admin-card"><p className="eyebrow">SEGMENT LIFECYCLE</p><h2>{segment.is_active?'Active audience':'Inactive audience'}</h2><p>{campaignCount?('This segment is referenced by '+campaignCount+' email campaign'+(campaignCount===1?'':'s')+'. It can be deactivated but not permanently deleted, preserving campaign history.'):'This segment is not used by any email campaign and can be permanently deleted.'}</p>{!campaignCount&&<form action={remove} style={{display:'grid',gap:10,maxWidth:420}}><label>Type DELETE to confirm<input name="confirmation" autoComplete="off" required/></label><button className="button ghost" type="submit">Delete unused segment</button></form>}</article>
 </section></main>
}