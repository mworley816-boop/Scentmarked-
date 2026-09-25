import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
type Perfume={id:string;name:string;slug:string;brands:any;perfume_notes:any[];perfume_accords:any[]};
function noteNames(p:Perfume){return (p?.perfume_notes||[]).map((x:any)=>x.notes?.name).filter(Boolean)}
function accordMap(p:Perfume){return new Map((p?.perfume_accords||[]).map((x:any)=>[x.accords?.name,Number(x.strength||50)]))}
function scoreMatch(a:Perfume,b:Perfume,freq:Map<string,number>,total:number){
 const A=new Set(noteNames(a)),B=new Set(noteNames(b)); const shared=[...A].filter(x=>B.has(x));
 const weight=(n:string)=>Math.log(1+total/(freq.get(n)||1)); const sharedW=shared.reduce((s,n)=>s+weight(n),0); const union=[...new Set([...A,...B])]; const unionW=union.reduce((s,n)=>s+weight(n),0); const noteScore=unionW?sharedW/unionW*100:0;
 const aa=accordMap(a),ab=accordMap(b), common=[...aa.keys()].filter(k=>ab.has(k)); const accordScore=common.length?common.reduce((s,k)=>s+(100-Math.abs((aa.get(k)||0)-(ab.get(k)||0))),0)/common.length:0;
 const completeness=Math.min(1,Math.min(A.size,B.size)/6); const combined=(noteScore*.78+accordScore*.22)*(.72+.28*completeness);
 return {score:Math.round(combined),shared,confidence:completeness>=.9?'High':completeness>=.55?'Medium':'Limited',noteScore:Math.round(noteScore),accordScore:Math.round(accordScore)};
}
export default async function Matches({searchParams}:{searchParams:Promise<{perfume?:string}>}){
 const {perfume}=await searchParams;const s=await createClient();const {data}=await s.from('perfumes').select('id,name,slug,brands(name),perfume_notes(notes(name)),perfume_accords(strength,accords(name))').eq('status','published').order('name');
 const ps=(data||[]) as unknown as Perfume[];const eligible=ps.filter(p=>noteNames(p).length>0);const selected=eligible.find(p=>p.slug===perfume)||eligible[0];const freq=new Map<string,number>();eligible.forEach(p=>new Set(noteNames(p)).forEach(n=>freq.set(n,(freq.get(n)||0)+1)));
 const matches=selected?eligible.filter(p=>p.id!==selected.id).map(p=>({...p,...scoreMatch(selected,p,freq,eligible.length)})).sort((a,b)=>b.score-a.score).slice(0,24):[];
 return <main><section><p className="eyebrow">SCENT MATCH</p><h1 className="page-title">Find what smells closest</h1><p className="lede">Matches use Scentmarked's database similarity: rare shared notes matter more than common notes, accord similarity contributes when available, and record completeness affects confidence. It is not an official clone claim.</p>
 <form className="picker"><select name="perfume" defaultValue={selected?.slug}>{eligible.map(p=><option value={p.slug} key={p.id}>{p.brands?.name} — {p.name}</option>)}</select><button className="button">Find matches</button></form>
 {selected&&<><div className="match-hero"><span>Matching against</span><strong>{selected.brands?.name} {selected.name}</strong><small>{noteNames(selected).join(' · ')}</small></div><div className="grid match-grid">{matches.map((m:any)=><article className="card match-card" key={m.id}><div className="match-score"><strong>{m.score}%</strong><span>database match</span></div><p className="eyebrow">{m.confidence} DATA CONFIDENCE</p><h3>{m.brands?.name} {m.name}</h3><p>{m.shared.length?`Shared: ${m.shared.join(', ')}`:'No exact notes shared.'}</p><div className="score-detail"><span>Notes {m.noteScore}%</span><span>Accords {m.accordScore}%</span></div><div className="card-links"><Link href={`/perfume/${m.slug}`}>View scent</Link><Link href={`/compare?a=${selected.slug}&b=${m.slug}`}>Compare</Link></div></article>)}</div></>}
 </section></main>
}
