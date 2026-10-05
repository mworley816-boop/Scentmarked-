import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDefaultPerfumeImage } from '@/lib/site-content'

const publicText=(value:any,max=160)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):''
const safeUrl=(value:any)=>{try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.toString():null}catch{return null}}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 try{
  const s=await createClient()
  const {data}=await s.from('brands').select('name,perfumes!inner(id)').eq('slug',slug).eq('perfumes.status','published').maybeSingle()
  const name=publicText(data?.name,120);if(name)return{title:`${name} Fragrances`,description:`Explore ${name} fragrances, verified notes and scent profiles on Scentmarked.`,alternates:{canonical:'/brand/'+encodeURIComponent(slug)},openGraph:{title:`${name} Fragrances`,description:`Explore ${name} fragrances and verified scent profiles on Scentmarked.`,url:'/brand/'+encodeURIComponent(slug),type:'website'}}
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
 const brandName=publicText(brand.name,120)||'Fragrance brand',brandDescription=publicText(brand.description,800),brandCountry=publicText(brand.country,100),logo=safeUrl(brand.logo_url)||safeUrl(defaultLogo),banner=safeUrl(brand.banner_url)||safeUrl(defaultBanner),website=safeUrl(brand.website),instagram=safeUrl(brand.instagram_url),facebook=safeUrl(brand.facebook_url),tiktok=safeUrl(brand.tiktok_url);perfumes=perfumes.map((p:any)=>({...p,name:publicText(p.name,120),slug:publicText(p.slug,200),concentration:publicText(p.concentration,80),image_url:safeUrl(p.image_url),perfume_notes:(p.perfume_notes||[]).map((n:any)=>({...n,notes:n.notes?{...n.notes,name:publicText(n.notes.name,80)}:n.notes})).filter((n:any)=>n.notes?.name)})).filter((p:any)=>p.name&&p.slug);return <main><section className="index-page"><div className="index-hero" style={banner?{backgroundImage:`linear-gradient(90deg,rgba(255,250,247,.96),rgba(255,250,247,.58)),url(${banner})`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>{logo&&<img src={logo} alt={brand.logo_url?brandName+" logo":"ScentMarked brand placeholder"} style={{maxWidth:180,maxHeight:80,objectFit:"contain",marginBottom:16}}/>}<p className="eyebrow">BRAND DIRECTORY</p><h1>{brandName}</h1><p>{brandDescription||`Explore published ${brandName} fragrances in the Scentmarked catalog.`}</p>{brandCountry&&<p className="muted">{brandCountry}</p>}<div className="result-actions">{website&&<a className="text-link" href={website} target="_blank" rel="noopener noreferrer">Official Website ↗</a>}{instagram&&<a className="text-link" href={instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}{facebook&&<a className="text-link" href={facebook} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}{tiktok&&<a className="text-link" href={tiktok} target="_blank" rel="noopener noreferrer">TikTok ↗</a>}</div></div>
  {loadError?<div className="empty-state"><h2>Fragrances are temporarily unavailable.</h2></div>:perfumes.length?<div className="brand-fragrance-grid">{perfumes.map((p:any)=><Link className="brand-fragrance-card" href={'/perfume/'+encodeURIComponent(p.slug)} key={p.id}><div className="mini-bottle">{(p.image_url||safeUrl(defaultPerfumeImage?.image_url))?<img src={p.image_url||safeUrl(defaultPerfumeImage.image_url)!} alt={p.image_url?p.name+" by "+brandName:(publicText(defaultPerfumeImage?.alt_text,160)||"ScentMarked fragrance image")} loading="lazy"/>:<div className="catalog-placeholder"><small>{brandName}</small><b>{p.name}</b></div>}</div><small>{brandName}</small><h2>{p.name}</h2><p>{p.concentration||'Fragrance'}{p.release_year?' · '+p.release_year:''}</p><div className="profile-tags">{(p.perfume_notes||[]).slice(0,4).map((n:any)=><span key={n.notes?.name}>{n.notes?.name}</span>)}</div></Link>)}</div>:<div className="empty-state"><h2>No published fragrances yet.</h2><p>This brand is in the catalog and its profiles are still being prepared.</p></div>}
 </section></main>
}
