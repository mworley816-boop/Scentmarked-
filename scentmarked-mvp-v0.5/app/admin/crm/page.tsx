import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'CRM Contacts',robots:{index:false,follow:false}}

const statuses=['active','unsubscribed','bounced','suppressed'] as const

async function requireAdmin(next='/admin/crm'){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent(next))
  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin)redirect('/')
  return s
}

async function updateContact(formData:FormData){
  'use server'
  const s=await requireAdmin()
  const id=String(formData.get('id')||'')
  const status=String(formData.get('status')||'active')
  if(!id||!statuses.includes(status as any))redirect('/admin/crm?error='+encodeURIComponent('Invalid contact update.'))
  const {error}=await s.from('crm_contacts').update({status,updated_at:new Date().toISOString()}).eq('id',id)
  if(error)redirect('/admin/crm?error='+encodeURIComponent('Contact could not be updated.'))
  redirect('/admin/crm')
}

export default async function AdminCrm({searchParams}:{searchParams:Promise<{q?:string,status?:string,consent?:string,error?:string}>}){
  const p=await searchParams
  const s=await requireAdmin()
  const q=(p.q||'').trim().slice(0,120)
  const status=statuses.includes(p.status as any)?p.status:''
  const consent=p.consent==='yes'||p.consent==='no'?p.consent:''

  let query=s.from('crm_contacts')
    .select('id,user_id,email,first_name,last_name,status,source,marketing_consent,marketing_consented_at,unsubscribed_at,last_engaged_at,created_at,profiles:user_id(display_name,scent_loved_notes,scent_avoided_notes,scent_sweetness,scent_projection,scent_longevity,scent_max_price,scent_occasions,scent_vibes,scent_presentations,scent_profile_completed_at)')
    .order('created_at',{ascending:false})
    .limit(250)

  if(q)query=query.or('email.ilike.%'+q.replaceAll('%','')+'%,first_name.ilike.%'+q.replaceAll('%','')+'%,last_name.ilike.%'+q.replaceAll('%','')+'%')
  if(status)query=query.eq('status',status)
  if(consent)query=query.eq('marketing_consent',consent==='yes')

  const {data,error}=await query
  const contacts=(data||[]) as any[]
  const active=contacts.filter(x=>x.status==='active').length
  const subscribed=contacts.filter(x=>x.marketing_consent&&x.status==='active').length
  const members=contacts.filter(x=>x.user_id).length

  return <main><section className="admin-page">
    <div className="admin-heading"><div><p className="eyebrow">ADMIN · CRM</p><h1>Contacts</h1><p>Manage members, email consent, scent-profile context and customer status.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link className="button ghost" href="/admin">Back to Admin</Link><Link className="button" href="/admin/email">Email</Link></div></div>

    {p.error&&<div className="notice error">{p.error}</div>}
    {error&&<div className="notice error">CRM contacts could not be loaded. Apply the CRM migration before using this page.</div>}

    <div className="admin-grid">
      <article className="admin-card"><p className="eyebrow">RESULTS</p><h2>{contacts.length}</h2><p>Contacts shown</p></article>
      <article className="admin-card"><p className="eyebrow">ACTIVE</p><h2>{active}</h2><p>Active contacts</p></article>
      <article className="admin-card"><p className="eyebrow">EMAILABLE</p><h2>{subscribed}</h2><p>Active with marketing consent</p></article>
      <article className="admin-card"><p className="eyebrow">MEMBERS</p><h2>{members}</h2><p>Linked ScentMarked accounts</p></article>
    </div>

    <form method="get" className="admin-card" style={{display:'grid',gap:12,gridTemplateColumns:'minmax(220px,1fr) repeat(2,minmax(150px,220px)) auto',alignItems:'end'}}>
      <label>Search<input name="q" defaultValue={q} placeholder="Email or name"/></label>
      <label>Status<select name="status" defaultValue={status}><option value="">All statuses</option>{statuses.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      <label>Marketing consent<select name="consent" defaultValue={consent}><option value="">Any</option><option value="yes">Consented</option><option value="no">Not consented</option></select></label>
      <button type="submit">Filter</button>
    </form>

    {!error&&!contacts.length?<div className="empty-state"><h2>No CRM contacts match these filters.</h2><p>Contacts will appear here after they are synced or added to the CRM.</p></div>:
    <div className="admin-list">{contacts.map(c=>{
      const profile=Array.isArray(c.profiles)?c.profiles[0]:c.profiles
      const name=[c.first_name,c.last_name].filter(Boolean).join(' ')||profile?.display_name||'Unnamed contact'
      const loved=(profile?.scent_loved_notes||[]).slice(0,6)
      return <article className="admin-card" key={c.id}>
        <div className="admin-heading"><div><p className="eyebrow">{c.status} · {c.source}</p><h2>{name}</h2><p><a href={'mailto:'+c.email}>{c.email}</a>{c.user_id?' · ScentMarked member':' · CRM-only contact'}</p><small>Added {new Date(c.created_at).toLocaleDateString()} · Marketing: {c.marketing_consent?'consented':'not consented'}</small></div>
          <form action={updateContact}><input type="hidden" name="id" value={c.id}/><select name="status" defaultValue={c.status}>{statuses.map(x=><option key={x} value={x}>{x}</option>)}</select><button type="submit">Update</button></form>
        </div>
        {profile&&<div><p><strong>Scent profile:</strong> {profile.scent_profile_completed_at?'Complete':'Incomplete'}{profile.scent_sweetness?' · Sweetness '+profile.scent_sweetness+'/5':''}{profile.scent_projection?' · Projection '+profile.scent_projection+'/5':''}{profile.scent_longevity?' · Longevity '+profile.scent_longevity+'/5':''}{profile.scent_max_price!=null?' · Budget $'+profile.scent_max_price:''}</p>{loved.length>0&&<p><strong>Loves:</strong> {loved.join(', ')}</p>}{profile.scent_vibes?.length>0&&<p><strong>Vibes:</strong> {profile.scent_vibes.slice(0,5).join(', ')}</p>}</div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}><Link className="button ghost" href={'/admin/crm/'+c.id}>Open contact</Link></div>
      </article>
    })}</div>}
  </section></main>
}
