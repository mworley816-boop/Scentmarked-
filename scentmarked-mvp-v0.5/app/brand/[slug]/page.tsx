import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 try{
  const s=await createClient()
  const {data}=await s.from('brands').select('name').eq('slug',slug).maybeSingle()
  if(data?.name)return{title:`${data.name} Fragrances`,description:`Explore ${data.name} fragrances, verified notes and scent profiles on Scentmarked.`,alternates:{canonical:'/brand/'+slug},openGraph:{title:`${data.name} Fragrances`,description:`Explore ${data.name} fragrances and verified scent profiles on Scentmarked.`,url:'/brand/'+slug,type:'website'}}
 }catch{}
 return{title:'Fragrance Brand'}
}

export default async function BrandPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 let brand:any=null,perfumes:any[]=[],loadError=false
 try{
  const s=await createClient()
  const b=await s.from('brands').select('id,name,slug,country,description,website').eq('slug',slug).maybeSingle()
  if(b.error)loadError=true
  else if(!b.data)notFound()
  else{
   brand=b.data
   const p=await s.from('perfumes').select('id,name,slug,concentration,release_year,perfume_notes(notes(name))').eq('brand_id',brand.id).eq('status','published').order('name')
   if(p.error)loadError=true;else perfumes=p.data||[]
  }
 }catch{loadError=true}
 if(loadError&&!brand)return <main><section className="empty-state"><h1>Brand page temporarily unavailable</h1><p>Please try again in a moment.</p><Link className="button" href="/brands">Browse Brands</Link></section></main>
 return <main><section className="index-page"><div className="index-hero"><p className="eyebrow">BRAND DIRECTORY</p><h1>{brand.name}</h1><p>{brand.description||`Explore published ${brand.name} fragrances in the Scentmarked catalog.`}</p>{brand.country&&<p className="muted">{brand.country}</p>}</div>
  {loadError?<div className="empty-state"><h2>Fragrances are temporarily unavailable.</h2></div>:perfumes.length?<div className="brand-fragrance-grid">{perfumes.map((p:any)=><Link className="brand-fragrance-card" href={'/perfume/'+p.slug} key={p.id}><div className="mini-bottle">{p.name.slice(0,1)}</div><small>{brand.name}</small><h2>{p.name}</h2><p>{p.concentration||'Fragrance'}{p.release_year?' · '+p.release_year:''}</p><div className="profile-tags">{(p.perfume_notes||[]).slice(0,4).map((n:any)=><span key={n.notes?.name}>{n.notes?.name}</span>)}</div></Link>)}</div>:<div className="empty-state"><h2>No published fragrances yet.</h2><p>This brand is in the catalog and its profiles are still being prepared.</p></div>}
 </section></main>
}
