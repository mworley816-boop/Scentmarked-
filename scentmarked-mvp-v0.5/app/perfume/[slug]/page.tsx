import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarkScent from '@/components/mark-scent'
import RateScent from '@/components/rate-scent'

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 try{const s=await createClient();const {data}=await s.from('perfumes').select('name,description,brands(name)').eq('slug',slug).eq('status','published').maybeSingle();if(data?.name){const brand=(data.brands as any)?.name;return{title:`${data.name}${brand?' by '+brand:''}`,description:data.description||`Explore verified notes, scent DNA, ratings and similar fragrances for ${data.name} on Scentmarked.`}}}catch{}
 return{title:'Fragrance Profile'}
}
export default async function PerfumePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;let s:any;let result:any
 try{s=await createClient();result=await s.from('perfumes').select('id,name,slug,description,concentration,release_year,country,brands(name,slug),perfume_notes(position,notes(name,slug)),perfume_accords(strength,accords(name,slug)),ratings(overall,longevity,projection,sweetness)').eq('slug',slug).eq('status','published').maybeSingle()}catch{return <main className="profile-page"><section className="empty-state"><h1>Fragrance profile temporarily unavailable</h1><p>Please try again in a moment.</p><Link className="button" href="/discover">Discover Fragrances</Link></section></main>}
 if(result.error||!result.data)notFound()
 const p:any=result.data,notes:any[]=p.perfume_notes||[],accords:any[]=p.perfume_accords||[],brand=p.brands?.name||'Scentmarked',ratings:any[]=p.ratings||[]
 const avg=ratings.length?(ratings.reduce((a:number,r:any)=>a+Number(r.overall),0)/ratings.length).toFixed(1):null
 const metric=(key:string)=>{const rows=ratings.filter((r:any)=>Number(r[key])>0);return rows.length?(rows.reduce((a:number,r:any)=>a+Number(r[key]),0)/rows.length).toFixed(1):null}
 const longevity=metric('longevity'),projection=metric('projection'),sweetness=metric('sweetness')
 let sources:any[]=[];try{const r=await s.from('perfume_sources').select('source_name,source_url,fields_verified,is_primary').eq('perfume_id',p.id).order('is_primary',{ascending:false});sources=r.data||[]}catch{}
 const group=(pos:string)=>notes.filter(n=>n.position===pos).map(n=>n.notes).filter(Boolean)
 return <main className="profile-page"><section className="profile-hero"><div className="profile-art"><div className="profile-bottle"><b>{p.name.slice(0,1)}</b></div></div><div className="profile-info"><p className="breadcrumbs"><Link href="/">Home</Link>　›　{p.brands?.slug?<Link href={'/brand/'+p.brands.slug}>{brand}</Link>:brand}　›　{p.name}</p><p className="eyebrow">{brand}</p><h1>{p.name}</h1>
 {avg?<p className="rating">★ {avg} <span>{ratings.length} community rating{ratings.length===1?'':'s'}</span></p>:<p className="verified-label">COMMUNITY RATING NOT YET AVAILABLE</p>}
 <div className="profile-tags">{notes.slice(0,5).map((n:any)=>n.notes?.slug?<Link href={'/note/'+n.notes.slug} key={n.notes.slug}>{n.notes.name}</Link>:<span key={n.notes?.name}>{n.notes?.name}</span>)}</div><p className="profile-desc">{p.description||'Verified scent details are being added.'}</p><p className="detail-line">◉　{p.concentration||'Fragrance'}　　{p.release_year||''}　　{p.country||''}</p><div className="profile-actions"><MarkScent perfumeId={p.id} initial={[]}/><Link className="button" href={'/matches?perfume='+p.slug}>Find a Match　→</Link></div></div></section>
 <section className="profile-body"><div className="dna-side"><h2>Scentmarked DNA</h2><p>Verified accord data when available.</p>{accords.length?[...accords].sort((a:any,b:any)=>(b.strength||0)-(a.strength||0)).slice(0,8).map((a:any)=><div className="dna-bar" key={a.accords?.name}><span>{a.accords?.name}</span><i><b style={{width:(a.strength||0)+'%'}}/></i><em>{a.strength}%</em></div>):<p className="muted">Accord strength data has not been verified for this fragrance yet.</p>}</div>
 <div className="notes-side">{[['top','Top Notes','✦'],['heart','Heart Notes','❀'],['base','Base Notes','◆']].map(([pos,label,icon])=><div key={pos}><h3>{label}</h3><div className="note-cloud">{group(pos).map((n:any)=>n.slug?<Link href={'/note/'+n.slug} key={n.slug}>{icon}<b>{n.name}</b></Link>:<span key={n.name}>{icon}<b>{n.name}</b></span>)}</div></div>)}</div></section>
 {ratings.length>0&&<section className="community-performance"><p className="eyebrow">COMMUNITY WEAR DATA</p><h2>How it wears</h2><div>{longevity&&<span><b>{longevity}/5</b>Longevity</span>}{projection&&<span><b>{projection}/5</b>Projection</span>}{sweetness&&<span><b>{sweetness}/5</b>Sweetness</span>}</div></section>}
 <RateScent perfumeId={p.id}/>
 <section className="source-card"><h2>Sources & verification</h2>{sources.length?sources.map((x:any)=><div className="source-row" key={x.source_url}><div><strong>{x.is_primary?'✓ Primary source':'Reference'} · {x.source_name}</strong><p>{(x.fields_verified||[]).join(' · ')}</p></div><a href={x.source_url} target="_blank" rel="noreferrer">View source ↗</a></div>):<p>Source provenance is being added to this record.</p>}</section></main>
}
