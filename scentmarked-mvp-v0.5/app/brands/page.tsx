import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata={title:'Fragrance Brands',description:'Browse designer, niche and Middle Eastern fragrance houses in the Scentmarked catalog.',alternates:{canonical:'/brands'},openGraph:{title:'Fragrance Brands | Scentmarked',description:'Browse designer, niche and Middle Eastern fragrance houses in the Scentmarked catalog.',url:'/brands',type:'website'}}

export default async function Brands(){
 let brands:any[]=[];let loadError=false
 try{const s=await createClient();const result=await s.from('brands').select('id,name,slug,country,logo_url,perfumes!inner(id,status)').eq('perfumes.status','published').order('name');if(result.error)loadError=true;else brands=(result.data||[]).filter((b:any)=>(b.perfumes||[]).length).sort((a:any,b:any)=>(b.perfumes?.length||0)-(a.perfumes?.length||0)||a.name.localeCompare(b.name))}catch{loadError=true}
 return <main><section className="index-page"><div className="index-hero"><p className="eyebrow">FRAGRANCE HOUSES</p><h1>Explore Brands</h1><p>Browse the designer, niche and Middle Eastern houses in the growing Scentmarked catalog.</p></div>
 {loadError?<div className="empty-state"><h2>Brands are temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:<div className="brand-index">{brands.map(b=><Link href={'/brand/'+b.slug} key={b.id}><div className="brand-monogram">{b.logo_url?<img src={b.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:b.name.slice(0,2).toUpperCase()}</div><h3>{b.name}</h3><p>{b.country?b.country+' · ':''}{b.perfumes.length} fragrance{b.perfumes.length===1?'':'s'}</p><span>Explore scents →</span></Link>)}</div>}</section></main>
}
