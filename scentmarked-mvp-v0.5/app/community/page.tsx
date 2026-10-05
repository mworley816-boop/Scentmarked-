import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TasteBadge from '@/components/taste-badge'

export const metadata={title:'Fragrance Community',description:'Read community fragrance reviews and scent comparisons from Scentmarked members.',alternates:{canonical:'/community'},openGraph:{title:'Fragrance Community | Scentmarked',description:'Read fragrance reviews and scent comparisons from Scentmarked members.',url:'/community',type:'website'}}

const reviewDate=(value:string)=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}

export default async function Community(){
 let ratings:any[]=[],votes:any[]=[],top:any[]=[],loadError=false
 try{
  const s=await createClient()
  const reviews=await s.from('ratings').select('id,overall,longevity,projection,sweetness,review,created_at,perfume_id,user_id').not('review','is',null).order('created_at',{ascending:false}).limit(50)
  if(reviews.error)loadError=true
  const comparisons=await s.from('comparison_votes').select('id,similarity,created_at,perfume_a_id,perfume_b_id').order('created_at',{ascending:false}).limit(50)
  const popular=await s.from('ratings').select('overall,perfume_id')
  const reviewerIds=[...new Set((reviews.data||[]).map((x:any)=>x.user_id).filter(Boolean))]
  const communityProfiles=reviewerIds.length?await s.from('community_profiles').select('user_id,display_name,taste_label,show_taste_badge').in('user_id',reviewerIds):null
  const communityById=new Map((communityProfiles?.data||[]).map((x:any)=>[x.user_id,x]))
  const perfumeIds=[...new Set([...(reviews.data||[]).map((x:any)=>x.perfume_id),...(comparisons.data||[]).flatMap((x:any)=>[x.perfume_a_id,x.perfume_b_id]),...(popular.data||[]).map((x:any)=>x.perfume_id)].filter(Boolean))]
  const published=perfumeIds.length?await s.from('perfumes').select('id,name,slug,brands(name)').in('id',perfumeIds).eq('status','published'):null
  if(published?.error)loadError=true
  const byId=new Map((published?.data||[]).map((p:any)=>[p.id,p]))
  if(!reviews.error)ratings=(reviews.data||[]).map((r:any)=>({...r,perfumes:byId.get(r.perfume_id),communityProfile:communityById.get(r.user_id)})).filter((r:any)=>r.perfumes).slice(0,12)
  if(!comparisons.error)votes=(comparisons.data||[]).map((v:any)=>({...v,perfume_a:byId.get(v.perfume_a_id),perfume_b:byId.get(v.perfume_b_id)})).filter((v:any)=>v.perfume_a&&v.perfume_b).slice(0,8)
  if(!popular.error){
   const map=new Map<string,any>()
   for(const r of popular.data||[]){const p:any=byId.get(r.perfume_id);if(!p?.id)continue;const x=map.get(p.id)||{...p,total:0,count:0};x.total+=Number(r.overall)||0;x.count++;map.set(p.id,x)}
   top=[...map.values()].filter(x=>x.count>0).sort((a,b)=>b.count-a.count||b.total/b.count-a.total/a.count).slice(0,6)
  }
 }catch{loadError=true}
 return <main><section className="community-page"><div className="community-hero"><p className="eyebrow">SCENTMARKED COMMUNITY</p><h1>Smell it. Mark it. Share it.</h1><p>See what fragrance lovers are rating and comparing across Scentmarked.</p><div><Link className="button" href="/discover">Discover Scents</Link><Link className="button ghost" href="/collection">My Marks</Link></div></div>
 {loadError?<div className="empty-state"><h2>Community activity is temporarily unavailable.</h2><p>You can still discover, compare and save fragrances.</p></div>:<>
 {top.length>0&&<div className="community-section"><div className="section-head"><div><p className="eyebrow">MOST RATED</p><h2>Most Rated Fragrances</h2><p>Fragrances with the most Scentmarked ratings so far. Average scores are shown for context and do not determine this ranking.</p></div></div><div className="community-favorites">{top.map((p:any)=><Link href={'/perfume/'+p.slug} key={p.id}><small>{p.brands?.name}</small><h3>{p.name}</h3><strong>★ {(p.total/p.count).toFixed(1)} average</strong><span>{p.count} rating{p.count===1?'':'s'}{p.count<3?' · Early data':''}</span></Link>)}</div></div>}
 <div className="community-section"><div className="section-head"><div><h2>Recent Reviews</h2><p>Real impressions from the community.</p></div></div><div className="review-grid">{ratings.length?ratings.map((r:any)=><article key={r.id}><p className="review-stars">{'★'.repeat(Math.max(0,Math.min(5,Number(r.overall)||0)))}</p><h3><Link href={'/perfume/'+r.perfumes?.slug}>{r.perfumes?.name}</Link></h3><small>{r.perfumes?.brands?.name}</small><p>{r.review}</p>{(r.longevity||r.projection||r.sweetness)&&<p className="muted">{[r.longevity&&`Longevity ${r.longevity}/5`,r.projection&&`Projection ${r.projection}/5`,r.sweetness&&`Sweetness ${r.sweetness}/5`].filter(Boolean).join(' · ')}</p>}<span className="review-author">— {r.communityProfile?.display_name||'Scentmarked member'}{reviewDate(r.created_at)?' · '+reviewDate(r.created_at):''}<TasteBadge label={r.communityProfile?.taste_label} visible={r.communityProfile?.show_taste_badge!==false}/></span></article>):<div className="empty-community"><h3>Community reviews are just getting started.</h3><p>Rate fragrances as you explore them and this space will grow with the community.</p></div>}</div></div>
 <div className="community-section"><h2>Recent Comparisons</h2><div className="vote-grid">{votes.length?votes.map((v:any)=><Link href={'/compare?a='+v.perfume_a?.slug+'&b='+v.perfume_b?.slug} key={v.id}><b>{v.perfume_a?.name}</b><span>⇄</span><b>{v.perfume_b?.name}</b><strong>{v.similarity}/5 similar</strong></Link>):<p className="muted">Comparison voting will appear here as members participate.</p>}</div></div>
 </>}
 <div className="community-cta"><p className="eyebrow">BUILD YOUR SCENT STORY</p><h2>Your collection starts with one Mark.</h2><p>Save what you own, want, tried, and love.</p><Link className="button" href="/collection">Open My Marks →</Link></div></section></main>
}
