import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ComparisonVote from '@/components/comparison-vote';

function names(p:any){return(p?.perfume_notes||[]).map((n:any)=>n.notes?.name).filter(Boolean)}
function group(p:any,pos:string){return(p?.perfume_notes||[]).filter((n:any)=>n.position===pos).map((n:any)=>n.notes?.name).filter(Boolean)}

export const metadata={title:'Compare Fragrances',description:'Compare verified fragrance notes and community similarity votes side by side.'}

export default async function Compare({searchParams}:{searchParams:Promise<{a?:string,b?:string}>}){
 const q=await searchParams;
 let perfumes:any[]=[];let loadError=false;
 try{
  const s=await createClient();
  const result=await s.from('perfumes').select('id,name,slug,concentration,release_year,brands(name),perfume_notes(position,notes(name))').eq('status','published').order('name');
  if(result.error)loadError=true;else perfumes=result.data||[];
 }catch{loadError=true}
 const a=perfumes.find(p=>p.slug===q.a)||perfumes[0];
 const b=perfumes.find(p=>p.slug===q.b)||perfumes[1];
 const same=!!a&&!!b&&a.id===b.id;
 let community:any[]=[];
 if(a&&b&&!same&&!loadError){try{const s=await createClient();const [first,second]=[a.id,b.id].sort();const votes=await s.from('comparison_votes').select('similarity,winner_perfume_id').eq('perfume_a_id',first).eq('perfume_b_id',second);community=votes.data||[]}catch{}}
 const communityCount=community.length,communityReady=communityCount>=3,avgSimilarity=communityReady?community.reduce((sum:number,v:any)=>sum+Number(v.similarity||0),0)/communityCount:0,winnerCounts=communityReady?community.reduce((m:Record<string,number>,v:any)=>{if(v.winner_perfume_id)m[v.winner_perfume_id]=(m[v.winner_perfume_id]||0)+1;return m},{}):{},aWins=winnerCounts[a?.id]||0,bWins=winnerCounts[b?.id]||0,draws=communityReady?communityCount-aWins-bWins:0;
 const shared:string[]=a&&b&&!same?Array.from(new Set<string>((names(a) as string[]).filter((x:string)=>(names(b) as string[]).includes(x)))):[];
 const card=(p:any)=><div className="compare-profile"><div className="compare-bottle">{p.name.slice(0,1)}</div><small>{p.brands?.name}</small><h3>{p.name}</h3><p>{p.concentration||'Fragrance'}{p.release_year?' · '+p.release_year:''}</p><Link className="text-link" href={'/perfume/'+p.slug}>VIEW PROFILE →</Link></div>;

 return <main><section className="compare-page"><p className="eyebrow">SIDE BY SIDE</p><h1 className="page-title">Compare Scents</h1><p className="lede">Compare verified fragrance details without the guesswork.</p>
  {loadError?<div className="empty-state"><h2>Comparison data is temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:perfumes.length<2?<div className="empty-state"><h2>More fragrances are needed to compare.</h2></div>:<>
   <form action="/compare" className="compare-picker"><select name="a" defaultValue={a?.slug}>{perfumes.map(p=><option key={p.id} value={p.slug}>{p.brands?.name} — {p.name}</option>)}</select><b>⇄</b><select name="b" defaultValue={b?.slug}>{perfumes.map(p=><option key={p.id} value={p.slug}>{p.brands?.name} — {p.name}</option>)}</select><button className="button">Compare</button></form>
   {a&&b&&<>{same?<div className="empty-state"><h2>Choose two different fragrances.</h2><p>Select another scent to see a meaningful side-by-side comparison.</p></div>:<><div className="compare-head">{card(a)}{card(b)}</div><div className="shared-notes"><p className="eyebrow">OVERLAP</p><h2>{shared.length} Shared Note{shared.length===1?'':'s'}</h2><div className="note-cloud">{shared.length?shared.map((n:string)=><span key={n}>✦<b>{n}</b></span>):<p>No exact verified notes shared.</p>}</div></div>
    {['top','heart','base'].map(pos=><div className="compare-layer" key={pos}><h2>{pos==='heart'?'Heart':pos[0].toUpperCase()+pos.slice(1)} Notes</h2><div><article><h3>{a.name}</h3>{group(a,pos).length?group(a,pos).map((n:string)=><p key={n}>◆ {n}</p>):<p className="muted">Not verified</p>}</article><article><h3>{b.name}</h3>{group(b,pos).length?group(b,pos).map((n:string)=><p key={n}>◆ {n}</p>):<p className="muted">Not verified</p>}</article></div></div>)}
    <section className="community-consensus"><p className="eyebrow">COMMUNITY COMPARISON</p><h2>{communityReady?'What members are reporting':'Community data is still building'}</h2>{communityReady?<><p><strong>{avgSimilarity.toFixed(1)} / 5</strong> average similarity from {communityCount} votes.</p><div className="consensus-grid"><span><b>{aWins}</b>{a.name} closer</span><span><b>{draws}</b>About equal</span><span><b>{bWins}</b>{b.name} closer</span></div></>:<p>{communityCount===0?'No comparison votes yet.':communityCount+' vote'+(communityCount===1?'':'s')+' so far.'} Consensus appears after at least 3 member votes.</p>}</section><ComparisonVote aId={a.id} bId={b.id} aName={a.name} bName={b.name}/></>}
   </>}
  </>}
 </section></main>
}
