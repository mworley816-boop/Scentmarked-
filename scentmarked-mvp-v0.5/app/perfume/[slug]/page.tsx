import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarkScent from '@/components/mark-scent'

export default async function PerfumePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params
  const s=await createClient()
  const {data:p}=await s.from('perfumes').select('id,name,slug,description,concentration,release_year,country,brands(name),perfume_notes(position,notes(name)),perfume_accords(strength,accords(name))').eq('slug',slug).eq('status','published').single()
  if(!p)notFound()
  const {data:{user}}=await s.auth.getUser()
  let initial:string[]=[]
  if(user){const {data}=await s.from('collection_items').select('status').eq('user_id',user.id).eq('perfume_id',p.id);initial=(data||[]).map(x=>x.status)}
  const notes:any[]=(p as any).perfume_notes||[]
  const accords:any[]=(p as any).perfume_accords||[]
  const brand=(p as any).brands?.name||'Scentmarked'
  return <main><section>
    <p className="eyebrow">{brand}</p><h1 className="page-title">{p.name}</h1>
    <p className="lede">{p.description||'This fragrance is in the Scentmarked catalog. Verified scent details are being added.'}</p>
    <div className="profile-actions"><Link className="button" href={`/matches?perfume=${p.slug}`}>Find a Match</Link><Link className="button ghost" href={`/compare?a=${p.slug}`}>Compare</Link></div>
    <MarkScent perfumeId={p.id} initial={initial}/>
    <div className="profile-grid"><div className="card"><h3>Fragrance details</h3><p>{[p.concentration,p.release_year,p.country].filter(Boolean).join(' · ')||'Details being verified.'}</p></div><div className="card"><h3>Scentmarked DNA</h3>{accords.length?accords.sort((a,b)=>(b.strength||0)-(a.strength||0)).slice(0,6).map(a=><div className="dna" key={a.accords?.name}><span>{a.accords?.name}</span><progress max="100" value={a.strength||0}/></div>):<p>Accord data is not verified yet.</p>}</div></div>
    <div className="card"><h3>Notes</h3>{notes.length?<div className="note-columns">{['top','heart','base'].map(pos=><div key={pos}><strong>{pos==='heart'?'Heart':pos[0].toUpperCase()+pos.slice(1)} notes</strong><p>{notes.filter(n=>n.position===pos).map(n=>n.notes?.name).filter(Boolean).join(', ')||'—'}</p></div>)}</div>:<p>Verified note pyramid coming soon. Scentmarked does not generate missing fragrance notes.</p>}</div>
  </section></main>
}
