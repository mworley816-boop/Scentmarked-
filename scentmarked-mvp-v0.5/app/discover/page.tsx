import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Search={q?:string;brand?:string;type?:string;note?:string;sort?:string}
const middleEastern=['Lattafa','Maison Alhambra','Paris Corner','French Avenue','Khadlaj','Swiss Arabian','Armaf','Afnan','Rasasi','Al Haramain']
const niche=['Giardini di Toscana','Maison Francis Kurkdjian','Parfums de Marly','Xerjoff','Mancera','Montale','Kilian Paris','Nishane','Initio']
const segment=(brand:string)=>middleEastern.includes(brand)?'Middle Eastern':niche.includes(brand)?'Niche':'Designer'
export const metadata={title:'Discover Fragrances',description:'Search and filter the Scentmarked fragrance catalog by brand, note and fragrance collection.'}

export default async function Discover({searchParams}:{searchParams:Promise<Search>}){
 const p=await searchParams;let all:any[]=[],loadError=false
 try{const s=await createClient();const result=await s.from('perfumes').select('id,name,slug,concentration,release_year,created_at,brands(name),perfume_notes(notes(name)),ratings(overall)').eq('status','published').order('name');if(result.error)loadError=true;else all=(result.data||[]) as any[]}catch{loadError=true}
 const brands=[...new Set(all.map(x=>x.brands?.name).filter(Boolean))].sort(),q=(p.q||'').trim().toLowerCase(),note=(p.note||'').trim().toLowerCase()
 let data=all.filter(x=>{const brand=x.brands?.name||'',notes=(x.perfume_notes||[]).map((y:any)=>y.notes?.name).filter(Boolean);return(!q||(`${x.name} ${brand} ${notes.join(' ')}`).toLowerCase().includes(q))&&(!p.brand||brand===p.brand)&&(!p.type||segment(brand)===p.type)&&(!note||notes.some((z:string)=>z.toLowerCase().includes(note)))})
 const rating=(x:any)=>{const r=(x.ratings||[]).map((v:any)=>Number(v.overall)).filter(Boolean);return r.length?r.reduce((a:number,b:number)=>a+b,0)/r.length:0}
 if(p.sort==='rating')data.sort((a,b)=>rating(b)-rating(a)||(b.ratings?.length||0)-(a.ratings?.length||0))
 else if(p.sort==='newest')data.sort((a,b)=>(b.release_year||0)-(a.release_year||0)||a.name.localeCompare(b.name))
 else if(p.sort==='az')data.sort((a,b)=>a.name.localeCompare(b.name))
 return <main><section className="discover-page"><div className="discover-banner"><p className="eyebrow">SCENT LIBRARY</p><h1>Discover Fragrances</h1><p>Explore designer, Middle Eastern and niche scents by house, note and fragrance style.</p><form action="/discover"><span>⌕</span><input name="q" defaultValue={p.q} placeholder="Search perfume, brand, note, or vibe…"/><button className="button">Search</button></form></div>
 <form action="/discover" className="discover-tools"><select name="type" defaultValue={p.type||''}><option value="">All Collections</option><option>Middle Eastern</option><option>Designer</option><option>Niche</option></select><select name="brand" defaultValue={p.brand||''}><option value="">All Brands</option>{brands.map(brand=><option key={brand} value={brand}>{brand}</option>)}</select><input name="q" type="hidden" value={p.q||''}/><input name="note" defaultValue={p.note} placeholder="Filter by note"/><select name="sort" defaultValue={p.sort||''}><option value="">Catalog order</option><option value="az">A–Z</option><option value="newest">Newest release</option><option value="rating">Community rating</option></select><button type="submit">Apply</button><span>{data.length} scents</span></form>
 {(q||p.brand||p.type||note||p.sort)&&<div className="active-filters"><span>Showing filtered results</span><Link href="/discover">Clear all ×</Link></div>}
 {loadError?<div className="empty-state"><h2>The scent library is temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:!data.length?<div className="empty-state"><h2>No fragrances match those filters.</h2><p>Try a broader search, another brand, or clear the note filter.</p><Link className="button" href="/discover">Clear Filters</Link></div>:<div className="discover-grid">{data.map(x=>{const brand=x.brands?.name||'',notes=(x.perfume_notes||[]).map((y:any)=>y.notes?.name).filter(Boolean),avg=rating(x),count=x.ratings?.length||0;return <article key={x.id}><div className="discover-bottle">{x.name.slice(0,1)}<i>♡</i></div><small>{brand}</small><Link href={'/perfume/'+x.slug}><h3>{x.name}</h3></Link><p className="meta-line">{segment(brand)} · {x.concentration||'Fragrance'}</p>{avg>0&&<p className="stars">★ <b>{avg.toFixed(1)}</b> <em>{count} rating{count===1?'':'s'}</em></p>}<div className="note-chips">{notes.slice(0,4).map((n:string)=><Link href={'/discover?note='+encodeURIComponent(n)} key={n}>{n}</Link>)}</div><Link className="view-scent" href={'/perfume/'+x.slug}>VIEW SCENT</Link></article>})}</div>}
 </section></main>
}
