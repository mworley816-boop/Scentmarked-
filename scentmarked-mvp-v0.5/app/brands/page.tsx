import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const publicText=(value:any,max=160)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):''
const safeUrl=(value:any)=>{try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.toString():null}catch{return null}}

export const metadata={title:'Fragrance Brands',description:'Browse designer, niche and Middle Eastern fragrance houses in the Scentmarked catalog.',alternates:{canonical:'/brands'},openGraph:{title:'Fragrance Brands | Scentmarked',description:'Browse designer, niche and Middle Eastern fragrance houses in the Scentmarked catalog.',url:'/brands',type:'website'}}

export default async function Brands(){
 let brands:any[]=[];let defaultLogo:string|null=null;let loadError=false
 try{const s=await createClient();const [result,fallback]=await Promise.all([s.from('brands').select('id,name,slug,country,logo_url,perfumes!inner(id,status)').eq('perfumes.status','published').order('name'),s.from('site_content').select('image_url,starts_at,ends_at').eq('content_key','brand_logo_fallback').eq('is_active',true).maybeSingle()]);const x=fallback.data,now=Date.now();if(x?.image_url&&(!x.starts_at||new Date(x.starts_at).getTime()<=now)&&(!x.ends_at||new Date(x.ends_at).getTime()>=now))defaultLogo=safeUrl(x.image_url);if(result.error)loadError=true;else brands=(result.data||[]).map((b:any)=>({...b,name:publicText(b.name,120),slug:publicText(b.slug,200),country:publicText(b.country,100),logo_url:safeUrl(b.logo_url)})).filter((b:any)=>b.name&&b.slug&&(b.perfumes||[]).length).sort((a:any,b:any)=>(b.perfumes?.length||0)-(a.perfumes?.length||0)||a.name.localeCompare(b.name))}catch{loadError=true}
 return <main><section className="index-page"><div className="index-hero"><p className="eyebrow">FRAGRANCE HOUSES</p><h1>Explore Brands</h1><p>Browse the designer, niche and Middle Eastern houses in the growing Scentmarked catalog.</p></div>
 {loadError?<div className="empty-state"><h2>Brands are temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:<div className="brand-index">{brands.map(b=><Link href={'/brand/'+encodeURIComponent(b.slug)} key={b.id}><div className="brand-monogram">{(b.logo_url||defaultLogo)?<img src={b.logo_url||defaultLogo||''} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:b.name.slice(0,2).toUpperCase()}</div><h3>{b.name}</h3><p>{b.country?b.country+' · ':''}{b.perfumes.length} fragrance{b.perfumes.length===1?'':'s'}</p><span>Explore scents →</span></Link>)}</div>}</section></main>
}
