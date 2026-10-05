import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'CRM Segments',robots:{index:false,follow:false}}

const fields=['loved_note','avoided_note','vibe','occasion','presentation','sweetness_min','projection_min','longevity_min','max_price'] as const
const scentFamilies=['Gourmand','Fruity','Floral','Fresh','Citrus','Woody','Amber','Spicy','Musky','Aquatic','Green','Smoky']
const scentNotes=['Vanilla','Marshmallow','Caramel','Strawberry','Cherry','Peach','Mango','Pear','Coconut','Chocolate','Coffee','Praline','Rose','Jasmine','Orange Blossom','Bergamot','Lemon','Sandalwood','Oud','Musk','Amber','Patchouli']
const scentChoices=[...scentFamilies,...scentNotes]
const vibes=['Cozy & Comforting','Sexy & Seductive','Clean & Polished','Playful & Sweet','Elegant & Sophisticated','Bold & Mysterious','Fresh & Energetic','Dark & Luxurious']
const occasions=['Everyday','Work or School','Date Night','Going Out','Special Occasions','Cozy at Home','Vacation or Summer','Cold Weather']
const presentations=['Feminine-leaning','Masculine-leaning','Unisex / Gender-neutral','No preference']

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
  const multiFields=new Set(['loved_note','avoided_note','vibe','occasion','presentation'])
  const submitted=fields.map(field=>{
    const values=multiFields.has(field)?formData.getAll(field).map(String).map(x=>x.trim().slice(0,100)).filter(Boolean):[String(formData.get(field)||'').trim().slice(0,100)].filter(Boolean)
    return {field,values:[...new Set(values)]}
  }).filter(x=>x.values.length)
  if(!name)redirect('/admin/email/segments?error='+encodeURIComponent('Segment name is required.'))
  const allowed:Record<string,string[]>={
    loved_note:scentChoices,avoided_note:scentNotes,vibe:vibes,occasion:occasions,presentation:presentations,
    sweetness_min:['1','2','3','4','5'],projection_min:['1','2','3','4','5'],longevity_min:['1','2','3','4','5']
  }
  for(const {field,values} of submitted){
    if(field==='max_price'){
      const n=Number(values[0])
      if(values.length!==1||!Number.isSafeInteger(n)||n<1)redirect('/admin/email/segments?error='+encodeURIComponent('Maximum budget must be a positive whole number.'))
    }else if(values.some(value=>!allowed[field]?.includes(value))){
      redirect('/admin/email/segments?error='+encodeURIComponent('Choose valid questionnaire values for every segment condition.'))
    }
  }
  const rules:any={contact:{status:'active',marketing_consent:true},profile:{},match_modes:{}}
  for(const {field,values} of submitted){
    rules.profile[field]=multiFields.has(field)?values:values[0]
    if(multiFields.has(field)){
      const mode=String(formData.get(field+'_mode')||'all')
      rules.match_modes[field]=mode==='any'?'any':'all'
    }
  }
  const {error}=await s.from('crm_segments').insert({name,description:description||null,rules,is_active:true})
  if(error)redirect('/admin/email/segments?error='+encodeURIComponent(error.code==='23505'?'A segment with that name already exists.':'Segment could not be created.'))
  redirect('/admin/email/segments')
}

async function duplicateSegment(formData:FormData){
  'use server'
  const s=await requireAdmin()
  const id=Number(formData.get('id'))
  if(!Number.isSafeInteger(id))redirect('/admin/email/segments')
  const {data:source}=await s.from('crm_segments').select('name,description,rules').eq('id',id).maybeSingle()
  if(!source)redirect('/admin/email/segments?error='+encodeURIComponent('Segment could not be found.'))
  const base=String(source.name).slice(0,88)
  let created=false
  for(let i=1;i<=20&&!created;i++){
    const suffix=i===1?' Copy':' Copy '+i
    const {error}=await s.from('crm_segments').insert({name:(base+suffix).slice(0,100),description:source.description,rules:source.rules,is_active:false})
    if(!error)created=true
    else if(error.code!=='23505')redirect('/admin/email/segments?error='+encodeURIComponent('Segment could not be duplicated.'))
  }
  if(!created)redirect('/admin/email/segments?error='+encodeURIComponent('Could not choose a unique name for the duplicate.'))
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
  const modes=r?.match_modes||{}
  const parts=Object.entries(p).filter(([key])=>labels[key]).map(([key,value])=>labels[key]+' '+(Array.isArray(value)?value.join(modes[key]==='any'?' OR ':' + '):value))
  return parts.length?parts.join(' · '):'All active, consented contacts'
}

export default async function Segments({searchParams}:{searchParams:Promise<{error?:string}>}){
  const p=await searchParams
  const s=await requireAdmin()
  const {data,error}=await s.from('crm_segments').select('id,name,description,rules,is_active,created_at,updated_at').order('name')
  const segmentRows=data||[]
  const audienceCounts=new Map<number,number>()
  await Promise.all(segmentRows.filter((x:any)=>x.is_active).map(async(x:any)=>{
    const {data:count}=await s.rpc('count_email_segment_audience',{p_segment_id:x.id})
    audienceCounts.set(x.id,Number(count)||0)
  }))

  return <main><section className="admin-page">
    <div className="email-subpage-hero"><div><p className="eyebrow">EMAIL · AUDIENCES</p><h1>Audience Segments</h1><p>Build reusable audiences from marketing consent and ScentMarked taste signals.</p></div><div className="campaign-editor-actions"><Link className="button ghost" href="/admin/email">← Email dashboard</Link><Link className="button ghost" href="/admin/crm">CRM contacts</Link></div></div>
    {p.error&&<div className="notice error">{p.error}</div>}
    {error&&<div className="notice error">Segments could not be loaded.</div>}

    <article className="admin-card segment-builder"><p className="eyebrow">NEW SEGMENT</p><h2>Create an audience</h2><p>Every email segment automatically requires an active CRM contact with marketing consent.</p>
      <form action={createSegment} style={{display:'grid',gap:12}}>
        <label>Name<input name="name" maxLength={100} placeholder="Vanilla Lovers" required/></label>
        <label>Description<input name="description" maxLength={300} placeholder="Members who love vanilla"/></label>
        <p>Add any conditions you need. Blank fields are ignored, and all completed conditions must match.</p>
        <div className="admin-grid">
<fieldset><legend>Loved notes or families</legend><label>Match<select name="loved_note_mode" defaultValue="all"><option value="all">ALL checked values</option><option value="any">ANY checked value</option></select></label><div className="quiz-check-grid">{scentChoices.map(x=><label className="quiz-check" key={'loved_note-'+x}><input type="checkbox" name="loved_note" value={x}/><span>{x}</span></label>)}</div></fieldset>
          <fieldset><legend>Avoided notes</legend><label>Match<select name="avoided_note_mode" defaultValue="all"><option value="all">ALL checked values</option><option value="any">ANY checked value</option></select></label><div className="quiz-check-grid">{scentNotes.map(x=><label className="quiz-check" key={'avoided_note-'+x}><input type="checkbox" name="avoided_note" value={x}/><span>{x}</span></label>)}</div></fieldset>
          <fieldset><legend>Vibes</legend><label>Match<select name="vibe_mode" defaultValue="all"><option value="all">ALL checked values</option><option value="any">ANY checked value</option></select></label><div className="quiz-check-grid">{vibes.map(x=><label className="quiz-check" key={'vibe-'+x}><input type="checkbox" name="vibe" value={x}/><span>{x}</span></label>)}</div></fieldset>
          <fieldset><legend>Occasions</legend><label>Match<select name="occasion_mode" defaultValue="all"><option value="all">ALL checked values</option><option value="any">ANY checked value</option></select></label><div className="quiz-check-grid">{occasions.map(x=><label className="quiz-check" key={'occasion-'+x}><input type="checkbox" name="occasion" value={x}/><span>{x}</span></label>)}</div></fieldset>
          <fieldset><legend>Presentations</legend><label>Match<select name="presentation_mode" defaultValue="all"><option value="all">ALL checked values</option><option value="any">ANY checked value</option></select></label><div className="quiz-check-grid">{presentations.map(x=><label className="quiz-check" key={'presentation-'+x}><input type="checkbox" name="presentation" value={x}/><span>{x}</span></label>)}</div></fieldset>
          <label>Minimum sweetness<input name="sweetness_min" type="number" min="1" max="5" step="1"/></label>
          <label>Minimum projection<input name="projection_min" type="number" min="1" max="5" step="1"/></label>
          <label>Minimum longevity<input name="longevity_min" type="number" min="1" max="5" step="1"/></label>
          <label>Maximum budget<input name="max_price" type="number" min="1" step="1" placeholder="100"/></label>
        </div>
        <div><button type="submit">Create segment</button></div>
      </form>
    </article>

    <div className="email-section-heading"><div><p className="eyebrow">SAVED AUDIENCES</p><h2>Segment library</h2><p>{segmentRows.length||0} saved segment{segmentRows.length===1?'':'s'}. Active segments show their current eligible audience.</p></div></div>{!segmentRows.length?<div className="empty-state"><h2>No audience segments yet.</h2></div>:<div className="admin-list">{segmentRows.map((x:any)=><article className="admin-card segment-library-row" key={x.id}><div className="segment-library-main"><div><span className={'segment-status '+(x.is_active?'active':'inactive')}>{x.is_active?'ACTIVE':'INACTIVE'}</span><h2>{x.name}</h2>{x.description&&<p>{x.description}</p>}<p><strong>Audience:</strong> {ruleLabel(x.rules)}</p><p><strong>Current eligible audience:</strong> {x.is_active?(audienceCounts.get(x.id)||0):'Inactive'}</p><small>Consent required · Created {new Date(x.created_at).toLocaleDateString()}</small><div className="segment-actions"><Link className="button ghost" href={'/admin/email/segments/'+x.id}>Edit</Link><form action={duplicateSegment}><input type="hidden" name="id" value={x.id}/><button className="button ghost" type="submit">Duplicate</button></form></div></div><form action={toggleSegment}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="active" value={String(!x.is_active)}/><button className="button ghost" type="submit">{x.is_active?'Deactivate':'Activate'}</button></form></div></article>)}</div>}
  </section></main>
}
