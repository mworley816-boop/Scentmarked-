import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDefaultPerfumeImage } from '@/lib/site-content'

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 try{
  const s=await createClient()
  const {data}=await s.from('brands').select('name').eq('slug',slug).maybeSingle()
  if(data?.name)return{title:`${data.name} Fragrances`,description:`Explore ${data.name} fragrances, verified notes and scent profiles on Scentmarked.`,alternates:{canonical:'/brand/'+slug},openGraph:{title:`${data.name} Fragrances`,description:`Explore ${data.name} fragrances and verified scent profiles on Scentmarked.`,url:'/brand/'+slug,type:'website'}}
 }catch{}
 return{title:'Fragrance Brand',robots:{index:false,follow:true}}
}

export default async function BrandPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 let brand:any=null,perfumes:any[]=[],defaultLogo:string|null=null,defaultBanner:string|null=null,defaultPerfumeImage:any=null,loadError=false
 try{
  const s=await createClient()
  defaultPerfumeImage=await getDefaultPerfumeImage()
  const b=await s.from('brands').select('id,name,slug,country,description,website,logo_url,banner_url,instagram_url,facebook_url,tiktok_url').eq('slug',slug).maybeSingle()
  if(b.error)loadError=true
  else if(!b.data)notFound()
  else{
   brand=b.data
   const defaults=await s.from('site_content').select('content_key,image_url,starts_at,ends_at').in('content_key',['brand_logo_fallback','brand_banner_fallback']).eq('is_active',true);if(!defaults.error){const now=Date.now(),visible=(x:any)=>x?.image_url&&(!x.starts_at||new Date(x.starts_at).getTime()<=now)&&(!x.ends_at||new Date(x.ends_at).getTime()>=now),items=(defaults.data||[]).filter(visible);defaultLogo=items.find((x:any)=>x.content_key==='brand_logo_fallback')?.image_url||null;defaultBanner=items.find((x:any)=>x.content_key==='brand_banner_fallback')?.image_url||null}
   const p=await s.from('perfumes').select('id,name,slug,image_url,concentration,release_year,perfume_notes(notes(name))').eq('brand_id',brand.id).eq('status','published').order('name')
   if(p.error)loadError=true;else perfumes=p.data||[]
  }
 }catch{loadError=true}
 if(loadError&&!brand)return <main><section className="empty-state"><h1>Brand page temporarily unavailable</h1><p>Please try again in a moment.</p><Link className="button" href="/brands">Browse Brands</Link></section></main>
 const logo=brand.logo_url||defaultLogo,banner=brand.banner_url||defaultBanner;return <main><section className="index-page"><div className="index-hero" style={banner?{backgroundImage:`linear-gradient(90deg,rgba(255,250,247,.96),rgba(255,250,247,.58)),url(${banner})`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>{logo&&<img src={logo} alt={brand.logo_url?brand.name+" logo":"ScentMarked brand placeholder"} style={{maxWidth:180,maxHeight:80,objectFit:"contain",marginBottom:16}}/>}<p className="eyebrow">BRAND DIRECTORY</p><h1>{brand.name}</h1><p>{brand.description||`Explore published ${brand.name} fragrances in the Scentmarked catalog.`}</p>{brand.country&&<p className="muted">{brand.country}</p>}<div className="result-actions">{brand.website&&<a className="text-link" href={brand.website} target="_blank" rel="noreferrer">Official Website ↗</a>}{brand.instagram_url&&<a className="text-link" href={brand.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a>}{brand.facebook_url&&<a className="text-link" href={brand.facebook_url} target="_blank" rel="noreferrer">Facebook ↗</a>}{brand.tiktok_url&&<a className="text-link" href={brand.tiktok_url} target="_blank" rel="noreferrer">TikTok ↗</a>}</div></div>
  {loadError?<div className="empty-state"><h2>Fragrances are temporarily unavailable.</h2></div>:perfumes.length?<div className="brand-fragrance-grid">{perfumes.map((p:any)=><Link className="brand-fragrance-card" href={'/perfume/'+p.slug} key={p.id}><div className="mini-bottle">{(p.image_url||defaultPerfumeImage?.image_url)?<img src={p.image_url||defaultPerfumeImage.image_url} alt={p.image_url?p.name+" by "+brand.name:(defaultPerfumeImage?.alt_text||"ScentMarked fragrance image")} loading="lazy"/>:<div className="catalog-placeholder"><small>{brand.name}</small><b>{p.name}</b></div>}</div><small>{brand.name}</small><h2>{p.name}</h2><p>{p.concentration||'Fragrance'}{p.release_year?' · '+p.release_year:''}</p><div className="profile-tags">{(p.perfume_notes||[]).slice(0,4).map((n:any)=><span key={n.notes?.name}>{n.notes?.name}</span>)}</div></Link>)}</div>:<div className="empty-state"><h2>No published fragrances yet.</h2><p>This brand is in the catalog and its profiles are still being prepared.</p></div>}
 </section></main>
}
