import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata={title:'Fragrance Community',description:'Read community fragrance reviews and scent comparisons from Scentmarked members.',alternates:{canonical:'/community'},openGraph:{title:'Fragrance Community | Scentmarked',description:'Read fragrance reviews and scent comparisons from Scentmarked members.',url:'/community',type:'website'}}

export default async function Community(){
 let ratings:any[]=[],votes:any[]=[],top:any[]=[],loadError=false
 try{
  const s=await createClient()
  const reviews=await s.from('ratings').select('id,overall,review,created_at,perfumes(name,slug,brands(name)),profiles(display_name)').not('review','is',null).order('created_at',{ascending:false}).limit(12)
  if(reviews.error)loadError=true;else ratings=reviews.data||[]
  const comparisons=await s.from('comparison_votes').select('id,similarity,created_at,perfume_a:perfumes!comparison_votes_perfume_a_id_fkey(name,slug),perfume_b:perfumes!comparison_votes_perfume_b_id_fkey(name,slug)').order('created_at',{ascending:false}).limit(8)
  if(!comparisons.error)votes=comparisons.data||[]
  const popular=await s.from('ratings').select('overall,perfumes(id,name,slug,brands(name))')
  if(!popular.error){
   const map=new Map<string,any>()
   for(const r of popular.data||[]){const p:any=r.perfumes;if(!p?.id)continue;const x=map.get(p.id)||{...p,total:0,count:0};x.total+=Number(r.overall)||0;x.count++;map.set(p.id,x)}
   top=[...map.values()].filter(x=>x.count>0).sort((a,b)=>b.count-a.count||b.total/b.count-a.total/a.count).slice(0,6)
  }
 }catch{loadError=true}
 return <main><section className="community-page"><div className="community-hero"><p className="eyebrow">SCENTMARKED COMMUNITY</p><h1>Smell it. Mark it. Share it.</h1><p>See what fragrance lovers are rating and comparing across Scentmarked.</p><div><Link className="button" href="/discover">Discover Scents</Link><Link className="button ghost" href="/collection">My Marks</Link></div></div>
 {loadError?<div className="empty-state"><h2>Community activity is temporarily unavailable.</h2><p>You can still discover, compare and save fragrances.</p></div>:<>
 {top.length>0&&<div className="community-section"><div className="section-head"><div><p className="eyebrow">MOST RATED</p><h2>Community Favorites</h2><p>Fragrances with the most Scentmarked ratings so far.</p></div></div><div className="community-favorites">{top.map((p:any)=><Link href={'/perfume/'+p.slug} key={p.id}><small>{p.brands?.name}</small><h3>{p.name}</h3><strong>★ {(p.total/p.count).toFixed(1)}</strong><span>{p.count} rating{p.count===1?'':'s'}</span></Link>)}</div></div>}
 <div className="community-section"><div className="section-head"><div><h2>Recent Reviews</h2><p>Real impressions from the community.</p></div></div><div className="review-grid">{ratings.length?ratings.map((r:any)=><article key={r.id}><p className="review-stars">{'★'.repeat(Math.max(0,Math.min(5,Number(r.overall)||0)))}</p><h3><Link href={'/perfume/'+r.perfumes?.slug}>{r.perfumes?.name}</Link></h3><small>{r.perfumes?.brands?.name}</small><p>{r.review}</p><span>— {r.profiles?.display_name||'Scentmarked member'}</span></article>):<div className="empty-community"><h3>Community reviews are just getting started.</h3><p>Rate fragrances as you explore them and this space will grow with the community.</p></div>}</div></div>
 <div className="community-section"><h2>Recent Comparisons</h2><div className="vote-grid">{votes.length?votes.map((v:any)=><Link href={'/compare?a='+v.perfume_a?.slug+'&b='+v.perfume_b?.slug} key={v.id}><b>{v.perfume_a?.name}</b><span>⇄</span><b>{v.perfume_b?.name}</b><strong>{v.similarity}/5 similar</strong></Link>):<p className="muted">Comparison voting will appear here as members participate.</p>}</div></div>
 </>}
 <div className="community-cta"><p className="eyebrow">BUILD YOUR SCENT STORY</p><h2>Your collection starts with one Mark.</h2><p>Save what you own, want, tried, and love.</p><Link className="button" href="/collection">Open My Marks →</Link></div></section></main>
}
