import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 try{const s=await createClient();const {data}=await s.from('notes').select('name,description').eq('slug',slug).maybeSingle();if(data?.name)return{title:`${data.name} Fragrance Note`,description:data.description||`Explore fragrances with ${data.name} and discover their verified scent profiles on Scentmarked.`,alternates:{canonical:'/note/'+slug},openGraph:{title:`${data.name} Fragrance Note`,description:data.description||`Explore fragrances with ${data.name} on Scentmarked.`,url:'/note/'+slug,type:'website'}}}catch{}
 return{title:'Fragrance Note'}
}
export default async function NotePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 let note:any=null,perfumes:any[]=[],loadError=false
 try{
  const s=await createClient()
  const n=await s.from('notes').select('id,name,slug,category,description').eq('slug',slug).maybeSingle()
  if(n.error)loadError=true;else if(!n.data)notFound();else{
   note=n.data
   const links=await s.from('perfume_notes').select('position,perfumes(id,name,slug,concentration,release_year,status,brands(name))').eq('note_id',note.id)
   if(links.error)loadError=true
   else perfumes=(links.data||[]).filter((x:any)=>x.perfumes?.status==='published')
  }
 }catch{loadError=true}
 if(loadError&&!note)return <main><section className="empty-state"><h1>Note page temporarily unavailable</h1><Link className="button" href="/notes">Browse Notes</Link></section></main>
 return <main><section className="index-page"><div className="index-hero"><p className="eyebrow">{note.category?note.category.toUpperCase()+' · ':''}FRAGRANCE NOTE</p><h1>{note.name}</h1><p>{note.description||`Explore published fragrances in Scentmarked with verified ${note.name} note data.`}</p></div>
 {loadError?<div className="empty-state"><h2>Fragrances are temporarily unavailable.</h2></div>:perfumes.length?<div className="brand-fragrance-grid">{perfumes.map((x:any)=>{const p=x.perfumes;return <Link className="brand-fragrance-card" href={'/perfume/'+p.slug} key={p.id}><div className="mini-bottle">{p.name.slice(0,1)}</div><small>{p.brands?.name}</small><h2>{p.name}</h2><p>{x.position?x.position[0].toUpperCase()+x.position.slice(1)+' note · ':''}{p.concentration||'Fragrance'}{p.release_year?' · '+p.release_year:''}</p></Link>})}</div>:<div className="empty-state"><h2>No published fragrances linked yet.</h2><p>This note is in the Scentmarked library and its verified fragrance links are still being expanded.</p></div>}
 </section></main>
}
