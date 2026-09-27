import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Community(){
 let ratings:any[]=[];let votes:any[]=[];let loadError=false;
 try{
  const s=await createClient();
  const reviews=await s.from('ratings').select('id,overall,review,created_at,perfumes(name,slug,brands(name)),profiles(display_name)').not('review','is',null).order('created_at',{ascending:false}).limit(12);
  if(reviews.error)loadError=true;else ratings=reviews.data||[];
  const comparisons=await s.from('comparison_votes').select('id,similarity,created_at,perfume_a:perfumes!comparison_votes_perfume_a_id_fkey(name,slug),perfume_b:perfumes!comparison_votes_perfume_b_id_fkey(name,slug)').order('created_at',{ascending:false}).limit(8);
  if(!comparisons.error)votes=comparisons.data||[];
 }catch{loadError=true}

 return <main><section className="community-page"><div className="community-hero"><p className="eyebrow">SCENTMARKED COMMUNITY</p><h1>Smell it. Mark it. Share it.</h1><p>See what fragrance lovers are rating and comparing across Scentmarked.</p><div><Link className="button" href="/discover">Discover Scents</Link><Link className="button ghost" href="/collection">My Marks</Link></div></div>
  {loadError?<div className="empty-state"><h2>Community activity is temporarily unavailable.</h2><p>You can still discover, compare and save fragrances.</p></div>:<>
   <div className="community-section"><div className="section-head"><div><h2>Recent Reviews</h2><p>Real impressions from the community.</p></div></div><div className="review-grid">{ratings.length?ratings.map((r:any)=><article key={r.id}><p className="review-stars">{'★'.repeat(Math.max(0,Math.min(5,Number(r.overall)||0)))}</p><h3>{r.perfumes?.name}</h3><small>{r.perfumes?.brands?.name}</small><p>{r.review}</p><span>— {r.profiles?.display_name||'Scentmarked member'}</span></article>):<div className="empty-community"><h3>Community reviews are just getting started.</h3><p>Rate fragrances as you explore them and this space will grow with the community.</p></div>}</div></div>
   <div className="community-section"><h2>Recent Comparisons</h2><div className="vote-grid">{votes.length?votes.map((v:any)=><article key={v.id}><b>{v.perfume_a?.name}</b><span>⇄</span><b>{v.perfume_b?.name}</b><strong>{v.similarity}/5 similar</strong></article>):<p className="muted">Comparison voting will appear here as members participate.</p>}</div></div>
  </>}
  <div className="community-cta"><p className="eyebrow">BUILD YOUR SCENT STORY</p><h2>Your collection starts with one Mark.</h2><p>Save what you own, want, tried, and love.</p><Link className="button" href="/collection">Open My Marks →</Link></div>
 </section></main>
}
