import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata={title:'Fragrance Notes',description:'Explore vanilla, marshmallow, fruit, floral, woody and gourmand fragrance notes in the Scentmarked catalog.',alternates:{canonical:'/notes'},openGraph:{title:'Fragrance Notes | Scentmarked',description:'Explore fragrance notes and discover scents that feature them.',url:'/notes',type:'website'}}

export default async function Notes(){
 let notes:any[]=[],loadError=false
 try{
  const s=await createClient()
  const r=await s.from('notes').select('id,name,slug,perfume_notes(perfume_id)').order('name')
  if(r.error)loadError=true
  else notes=(r.data||[]).filter((x:any)=>(x.perfume_notes||[]).length).sort((a:any,b:any)=>(b.perfume_notes?.length||0)-(a.perfume_notes?.length||0)||a.name.localeCompare(b.name))
 }catch{loadError=true}
 return <main><section className="index-page"><div className="index-hero"><p className="eyebrow">THE NOTE LIBRARY</p><h1>Explore Fragrance Notes</h1><p>Explore scent notes and jump directly into fragrances in the Scentmarked catalog that feature them.</p></div>
 {loadError?<div className="empty-state"><h2>Fragrance notes are temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:notes.length?<div className="note-index">{notes.map((n:any)=><Link href={'/note/'+n.slug} key={n.id}><span>✦</span><div><h3>{n.name}</h3><p>{n.perfume_notes.length} fragrance{n.perfume_notes.length===1?'':'s'}</p></div></Link>)}</div>:<div className="empty-state"><h2>The note library is being enriched.</h2><p>Verified fragrance notes will appear here as they are added to the catalog.</p></div>}</section></main>
}
