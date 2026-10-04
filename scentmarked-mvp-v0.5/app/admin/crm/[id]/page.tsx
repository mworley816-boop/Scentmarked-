import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'CRM Contact',robots:{index:false,follow:false}}

async function requireAdmin(next:string){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next='+encodeURIComponent(next))
  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin)redirect('/')
  return {s,user}
}

async function addNote(formData:FormData){
  'use server'
  const contactId=String(formData.get('contact_id')||'')
  const body=String(formData.get('body')||'').trim().slice(0,4000)
  const {s,user}=await requireAdmin('/admin/crm/'+contactId)
  if(!contactId||!body)redirect('/admin/crm/'+contactId+'?error='+encodeURIComponent('Enter a note first.'))
  const {error}=await s.from('crm_notes').insert({contact_id:contactId,author_user_id:user.id,body})
  if(error)redirect('/admin/crm/'+contactId+'?error='+encodeURIComponent('Note could not be saved.'))
  redirect('/admin/crm/'+contactId)
}

async function addTag(formData:FormData){
  'use server'
  const contactId=String(formData.get('contact_id')||'')
  const name=String(formData.get('tag')||'').trim().replace(/\s+/g,' ').slice(0,60)
  const {s}=await requireAdmin('/admin/crm/'+contactId)
  if(!contactId||!name)redirect('/admin/crm/'+contactId+'?error='+encodeURIComponent('Enter a tag first.'))
  const {data:tag,error:tagError}=await s.from('crm_tags').upsert({name},{onConflict:'name'}).select('id').single()
  if(tagError||!tag)redirect('/admin/crm/'+contactId+'?error='+encodeURIComponent('Tag could not be saved.'))
  const {error}=await s.from('crm_contact_tags').upsert({contact_id:contactId,tag_id:tag.id},{onConflict:'contact_id,tag_id'})
  if(error)redirect('/admin/crm/'+contactId+'?error='+encodeURIComponent('Tag could not be attached.'))
  redirect('/admin/crm/'+contactId)
}

async function removeTag(formData:FormData){
  'use server'
  const contactId=String(formData.get('contact_id')||'')
  const tagId=Number(formData.get('tag_id'))
  const {s}=await requireAdmin('/admin/crm/'+contactId)
  if(!contactId||!Number.isSafeInteger(tagId))redirect('/admin/crm/'+contactId)
  await s.from('crm_contact_tags').delete().eq('contact_id',contactId).eq('tag_id',tagId)
  redirect('/admin/crm/'+contactId)
}

export default async function CrmContact({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string}>}){
  const {id}=await params
  const p=await searchParams
  const {s}=await requireAdmin('/admin/crm/'+id)

  const [{data:contact,error},{data:notes},{data:tagLinks},{data:deliveries}]=await Promise.all([
    s.from('crm_contacts').select('id,user_id,email,first_name,last_name,status,source,marketing_consent,marketing_consented_at,unsubscribed_at,last_engaged_at,created_at,updated_at,profiles:user_id(display_name,scent_loved_notes,scent_avoided_notes,scent_sweetness,scent_projection,scent_longevity,scent_max_price,scent_occasions,scent_vibes,scent_presentations,scent_favorite_perfume_ids,scent_profile_completed_at)').eq('id',id).maybeSingle(),
    s.from('crm_notes').select('id,body,created_at').eq('contact_id',id).order('created_at',{ascending:false}).limit(100),
    s.from('crm_contact_tags').select('tag_id,crm_tags:tag_id(id,name)').eq('contact_id',id),
    s.from('email_deliveries').select('id,status,sent_at,delivered_at,opened_at,clicked_at,bounced_at,failed_at,skipped_at,error_message,created_at,email_campaigns:campaign_id(id,name,subject)').eq('contact_id',id).order('created_at',{ascending:false}).limit(25)
  ])

  if(error||!contact)notFound()
  const c=contact as any
  const profile=Array.isArray(c.profiles)?c.profiles[0]:c.profiles
  const name=[c.first_name,c.last_name].filter(Boolean).join(' ')||profile?.display_name||'Unnamed contact'
  const tags=(tagLinks||[]).map((x:any)=>Array.isArray(x.crm_tags)?x.crm_tags[0]:x.crm_tags).filter(Boolean)
  const emailRows=deliveries||[]
  const skippedCount=emailRows.filter((x:any)=>x.status==='skipped').length
  const attempted=emailRows.filter((x:any)=>!['queued','skipped'].includes(x.status)).length
  const deliveredCount=emailRows.filter((x:any)=>['delivered','opened','clicked'].includes(x.status)).length
  const openedCount=emailRows.filter((x:any)=>['opened','clicked'].includes(x.status)).length
  const clickedCount=emailRows.filter((x:any)=>x.status==='clicked').length
  const bouncedCount=emailRows.filter((x:any)=>x.status==='bounced').length
  const failedCount=emailRows.filter((x:any)=>x.status==='failed').length
  const unsubscribedCount=emailRows.filter((x:any)=>x.status==='unsubscribed').length
  const rate=(value:number,base:number)=>base>0?Math.round(value/base*1000)/10:0

  return <main><section className="admin-page">
    <div className="crm-profile-hero"><div className="crm-profile-identity"><div className="crm-profile-avatar">{name.slice(0,1).toUpperCase()}</div><div><p className="eyebrow">CRM CONTACT</p><h1>{name}</h1><a href={'mailto:'+c.email}>{c.email}</a><div className="crm-badges"><span className={'crm-status '+c.status}>{c.status}</span><span>{c.user_id?'ScentMarked member':'CRM only'}</span><span className={c.marketing_consent&&c.status==='active'?'consented':'muted'}>{c.marketing_consent&&c.status==='active'?'Email eligible':'No marketing'}</span></div></div></div><div className="crm-profile-actions"><Link className="button ghost" href="/admin/crm">← Contacts</Link><Link className="button" href="/admin/email">Email marketing</Link></div></div>
    {p.error&&<div className="notice error">{p.error}</div>}

    <div className="admin-grid">
      <article className="admin-card"><p className="eyebrow">EMAIL CONSENT</p><h2>{c.marketing_consent?'Consented':'Not consented'}</h2><p>{c.marketing_consented_at?'Since '+new Date(c.marketing_consented_at).toLocaleDateString():c.unsubscribed_at?'Unsubscribed '+new Date(c.unsubscribed_at).toLocaleDateString():'No consent timestamp'}</p></article>
      <article className="admin-card"><p className="eyebrow">SOURCE</p><h2>{c.source}</h2><p>Added {new Date(c.created_at).toLocaleDateString()}</p></article>
      <article className="admin-card"><p className="eyebrow">LAST ENGAGED</p><h2>{c.last_engaged_at?new Date(c.last_engaged_at).toLocaleDateString():'—'}</h2><p>CRM engagement</p></article>
    </div>

    <article className="admin-card crm-tags-card"><p className="eyebrow">ORGANIZATION</p><h2>Tags</h2><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{tags.length?tags.map((t:any)=><form action={removeTag} key={t.id}><input type="hidden" name="contact_id" value={id}/><input type="hidden" name="tag_id" value={t.id}/><button className="button ghost" type="submit" title="Remove tag">{t.name} ×</button></form>):<p>No tags yet.</p>}</div><form action={addTag} style={{display:'flex',gap:8,flexWrap:'wrap'}}><input type="hidden" name="contact_id" value={id}/><input name="tag" maxLength={60} placeholder="e.g. gourmand-lover" required/><button type="submit">Add tag</button></form></article>

    {profile&&<article className="admin-card crm-scent-profile"><div className="crm-card-heading"><div><p className="eyebrow">SCENTMARKED PROFILE</p><h2>Scent preferences</h2></div><span className={profile.scent_profile_completed_at?'data-ready':'data-missing'}>{profile.scent_profile_completed_at?'✓ Complete':'Incomplete'}</span></div><div className="crm-preference-grid"><div><small>LOVES</small><p>{profile.scent_loved_notes?.length?profile.scent_loved_notes.join(', '):'—'}</p></div><div><small>AVOIDS</small><p>{profile.scent_avoided_notes?.length?profile.scent_avoided_notes.join(', '):'—'}</p></div><div><small>VIBES</small><p>{profile.scent_vibes?.length?profile.scent_vibes.join(', '):'—'}</p></div><div><small>OCCASIONS</small><p>{profile.scent_occasions?.length?profile.scent_occasions.join(', '):'—'}</p></div><div><small>PRESENTATION</small><p>{profile.scent_presentations?.length?profile.scent_presentations.join(', '):'—'}</p></div><div><small>BUDGET</small><p>{profile.scent_max_price!=null?'Up to 

    <article className="admin-card crm-notes-card"><p className="eyebrow">INTERNAL</p><h2>Private notes</h2><form action={addNote}><input type="hidden" name="contact_id" value={id}/><textarea name="body" maxLength={4000} rows={4} placeholder="Add an internal CRM note…" required/><button type="submit">Save note</button></form>{notes?.length?<div className="admin-list" style={{marginTop:16}}>{notes.map((n:any)=><div key={n.id}><small>{new Date(n.created_at).toLocaleString()}</small><p style={{whiteSpace:'pre-wrap'}}>{n.body}</p></div>)}</div>:<p>No notes yet.</p>}</article>

    <article className="admin-card"><p className="eyebrow">EMAIL ENGAGEMENT</p><h2>Contact performance</h2><div className="admin-grid"><div><strong>{attempted}</strong><p>Attempted</p></div><div><strong>{rate(deliveredCount,attempted)}%</strong><p>Delivered · {deliveredCount}</p></div><div><strong>{rate(openedCount,deliveredCount)}%</strong><p>Opened · {openedCount}</p></div><div><strong>{rate(clickedCount,deliveredCount)}%</strong><p>Clicked · {clickedCount}</p></div><div><strong>{bouncedCount}</strong><p>Bounced</p></div><div><strong>{failedCount}</strong><p>Failed</p></div><div><strong>{skippedCount}</strong><p>Skipped · no email sent</p></div><div><strong>{unsubscribedCount}</strong><p>Unsubscribed</p></div></div></article>

    <article className="admin-card crm-email-activity"><p className="eyebrow">RECENT EMAILS</p><h2>Email activity</h2>{emailRows.length?<div className="admin-list">{emailRows.map((d:any)=>{const campaign=Array.isArray(d.email_campaigns)?d.email_campaigns[0]:d.email_campaigns;return <div key={d.id}><strong>{campaign?.name||'Email'}</strong><p>{campaign?.subject||'—'} · {d.status}</p><small>{d.sent_at?'Sent '+new Date(d.sent_at).toLocaleString():'Created '+new Date(d.created_at).toLocaleString()}{d.delivered_at?' · Delivered '+new Date(d.delivered_at).toLocaleString():''}{d.opened_at?' · Opened '+new Date(d.opened_at).toLocaleString():''}{d.clicked_at?' · Clicked '+new Date(d.clicked_at).toLocaleString():''}{d.bounced_at?' · Bounced '+new Date(d.bounced_at).toLocaleString():''}{d.failed_at?' · Failed '+new Date(d.failed_at).toLocaleString():''}{d.skipped_at?' · Skipped '+new Date(d.skipped_at).toLocaleString():''}</small>{d.error_message&&<p><small>{d.error_message}</small></p>}</div>})}</div>:<p>No campaign activity yet.</p>}</article>
  </section></main>
}
+profile.scent_max_price:'—'}</p></div></div><div className="crm-scent-scales"><span><b>{profile.scent_sweetness||'—'}</b>Sweetness / 5</span><span><b>{profile.scent_projection||'—'}</b>Projection / 5</span><span><b>{profile.scent_longevity||'—'}</b>Longevity / 5</span></div></article>}

    <article className="admin-card"><h2>Private notes</h2><form action={addNote}><input type="hidden" name="contact_id" value={id}/><textarea name="body" maxLength={4000} rows={4} placeholder="Add an internal CRM note…" required/><button type="submit">Save note</button></form>{notes?.length?<div className="admin-list" style={{marginTop:16}}>{notes.map((n:any)=><div key={n.id}><small>{new Date(n.created_at).toLocaleString()}</small><p style={{whiteSpace:'pre-wrap'}}>{n.body}</p></div>)}</div>:<p>No notes yet.</p>}</article>

    <article className="admin-card"><p className="eyebrow">EMAIL ENGAGEMENT</p><h2>Contact performance</h2><div className="admin-grid"><div><strong>{attempted}</strong><p>Attempted</p></div><div><strong>{rate(deliveredCount,attempted)}%</strong><p>Delivered · {deliveredCount}</p></div><div><strong>{rate(openedCount,deliveredCount)}%</strong><p>Opened · {openedCount}</p></div><div><strong>{rate(clickedCount,deliveredCount)}%</strong><p>Clicked · {clickedCount}</p></div><div><strong>{bouncedCount}</strong><p>Bounced</p></div><div><strong>{failedCount}</strong><p>Failed</p></div><div><strong>{skippedCount}</strong><p>Skipped · no email sent</p></div><div><strong>{unsubscribedCount}</strong><p>Unsubscribed</p></div></div></article>

    <article className="admin-card"><h2>Email activity</h2>{emailRows.length?<div className="admin-list">{emailRows.map((d:any)=>{const campaign=Array.isArray(d.email_campaigns)?d.email_campaigns[0]:d.email_campaigns;return <div key={d.id}><strong>{campaign?.name||'Email'}</strong><p>{campaign?.subject||'—'} · {d.status}</p><small>{d.sent_at?'Sent '+new Date(d.sent_at).toLocaleString():'Created '+new Date(d.created_at).toLocaleString()}{d.delivered_at?' · Delivered '+new Date(d.delivered_at).toLocaleString():''}{d.opened_at?' · Opened '+new Date(d.opened_at).toLocaleString():''}{d.clicked_at?' · Clicked '+new Date(d.clicked_at).toLocaleString():''}{d.bounced_at?' · Bounced '+new Date(d.bounced_at).toLocaleString():''}{d.failed_at?' · Failed '+new Date(d.failed_at).toLocaleString():''}{d.skipped_at?' · Skipped '+new Date(d.skipped_at).toLocaleString():''}</small>{d.error_message&&<p><small>{d.error_message}</small></p>}</div>})}</div>:<p>No campaign activity yet.</p>}</article>
  </section></main>
}
