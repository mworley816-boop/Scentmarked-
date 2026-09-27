import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type P={id:string;name:string;slug:string;brands:any;perfume_notes:any[]};
const noteNames=(p:P)=>(p?.perfume_notes||[]).map((x:any)=>x.notes?.name).filter(Boolean) as string[];
function score(a:P,b:P,f:Map<string,number>,total:number){
 const A=new Set(noteNames(a)),B=new Set(noteNames(b));
 const shared=[...A].filter(x=>B.has(x));
 const weight=(n:string)=>Math.log(1+total/(f.get(n)||1));
 const sharedWeight=shared.reduce((sum,n)=>sum+weight(n),0);
 const union=[...new Set([...A,...B])];
 const unionWeight=union.reduce((sum,n)=>sum+weight(n),0);
 const similarity=unionWeight?sharedWeight/unionWeight*100:0;
 const coverage=Math.min(1,Math.min(A.size,B.size)/6);
 return{score:Math.round(similarity*(.72+.28*coverage)),shared,confidence:coverage>=.9?'High':coverage>=.55?'Medium':'Limited'};
}

export default async function Matches({searchParams}:{searchParams:Promise<{perfume?:string}>}){
 const {perfume}=await searchParams;
 let perfumes:P[]=[];let loadError=false;
 try{
  const s=await createClient();
  const result=await s.from('perfumes').select('id,name,slug,brands(name),perfume_notes(notes(name))').eq('status','published').order('name');
  if(result.error)loadError=true;else perfumes=(result.data||[]) as unknown as P[];
 }catch{loadError=true}
 const eligible=perfumes.filter(p=>noteNames(p).length);
 const selected=eligible.find(p=>p.slug===perfume)||eligible[0];
 const freq=new Map<string,number>();
 eligible.forEach(p=>new Set(noteNames(p)).forEach(n=>freq.set(n,(freq.get(n)||0)+1)));
 const matches=selected?eligible.filter(p=>p.id!==selected.id).map(p=>({...p,...score(selected,p,freq,eligible.length)})).sort((a,b)=>b.score-a.score).slice(0,12):[];

 return <main><section className="match-page">
  <div className="match-banner"><div><p className="eyebrow">SCENTMARKED MATCH</p><h1>Find Your Scent Match</h1><p>Search a fragrance you love and we'll show you similar scents using verified note data.</p>
   <form action="/matches" className="match-search"><select name="perfume" defaultValue={selected?.slug}>{eligible.map(p=><option value={p.slug} key={p.id}>{p.brands?.name} — {p.name}</option>)}</select><button className="button">Find Matches</button></form>
   <div className="popular"><b>Popular searches</b>{eligible.slice(0,6).map(p=><Link key={p.id} href={'/matches?perfume='+p.slug}>{p.name}</Link>)}</div>
  </div><div className="match-art"><div className="match-bottle">S</div><i>Different paths.<br/>Same beautiful<br/>destination.</i></div></div>
  {loadError?<div className="empty-state"><h2>Matches are temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:selected?<><div className="selected-scent"><div className="selected-bottle">{selected.name.slice(0,1)}</div><div><small>MATCHING AGAINST</small><h2>{selected.brands?.name} {selected.name}</h2><p>{noteNames(selected).join(' · ')}</p></div></div>
   <div className="match-results">{matches.map((m:any)=><article key={m.id}><div className="result-bottle">{m.name.slice(0,1)}</div><small>{m.brands?.name}</small><h3>{m.name}</h3><div className="result-score"><strong>{m.score}%</strong><span>note similarity</span></div><p>{m.shared.length?'Shared: '+m.shared.slice(0,5).join(', '):'No exact notes shared.'}</p><small className="confidence">Data confidence: {m.confidence}</small><div className="result-actions"><Link href={'/perfume/'+m.slug}>View Scent</Link><Link href={'/compare?a='+selected.slug+'&b='+m.slug}>Compare</Link></div></article>)}</div>
   <p className="match-disclaimer">Similarity is calculated from verified note overlap and note rarity in the current catalog. It is not an official clone claim or a guarantee that two fragrances smell identical.</p>
  </>:<div className="empty-state"><h2>No verified note matches yet.</h2><p>More fragrances will appear here as note data is verified.</p></div>}
 </section></main>
}
