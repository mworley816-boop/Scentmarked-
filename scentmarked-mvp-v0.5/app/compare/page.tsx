import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ComparisonVote from '@/components/comparison-vote';
import PerfumeSearchPicker from '@/components/perfume-search-picker';
import SaveComparison from '@/components/save-comparison';

const publicText=(value:any,max=160)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';
const safeUrl=(value:any)=>{try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.toString():null}catch{return null}};
const safeCtaUrl=(value:any)=>{const raw=publicText(value,500);if(!raw)return null;if(raw.startsWith('/')&&!raw.startsWith('//'))return raw;return safeUrl(raw)};

function names(p:any){return(p?.perfume_notes||[]).map((n:any)=>n.notes?.name).filter(Boolean)}
function group(p:any,pos:string){return(p?.perfume_notes||[]).filter((n:any)=>n.position===pos).map((n:any)=>n.notes?.name).filter(Boolean)}
function dna(p:any){return(p?.perfume_accords||[]).filter((x:any)=>x.accords?.name&&Number(x.strength)>0).sort((a:any,b:any)=>Number(b.strength)-Number(a.strength))}
function catalogSimilarity(a:any,b:any){const A=new Set<string>(names(a).map((x:any)=>String(x).toLowerCase())),B=new Set<string>(names(b).map((x:any)=>String(x).toLowerCase())),union=new Set([...A,...B]),shared=[...A].filter(x=>B.has(x)).length,note=union.size?shared/union.size*100:0,DA=new Map<string,number>(dna(a).map((x:any)=>[String(x.accords.name).toLowerCase(),Number(x.strength)])),DB=new Map<string,number>(dna(b).map((x:any)=>[String(x.accords.name).toLowerCase(),Number(x.strength)])),accordNames=[...new Set([...DA.keys(),...DB.keys()])],accord=accordNames.length?Math.max(0,100-accordNames.reduce((sum,n)=>sum+Math.abs((DA.get(n)||0)-(DB.get(n)||0)),0)/accordNames.length):null,score=accord==null?note:note*.55+accord*.45;return Math.round(score)}
function dnaSummary(a:any,b:any){const A=new Map<string,number>(dna(a).map((x:any)=>[String(x.accords.name),Number(x.strength)])),B=new Map<string,number>(dna(b).map((x:any)=>[String(x.accords.name),Number(x.strength)])),all=[...new Set([...A.keys(),...B.keys()])],shared=all.filter(n=>A.has(n)&&B.has(n)).map(n=>({name:n,a:A.get(n)||0,b:B.get(n)||0,common:Math.min(A.get(n)||0,B.get(n)||0),diff:Math.abs((A.get(n)||0)-(B.get(n)||0))})).sort((x,y)=>y.common-x.common),differences=all.map(n=>({name:n,a:A.get(n)||0,b:B.get(n)||0,diff:Math.abs((A.get(n)||0)-(B.get(n)||0))})).filter(x=>x.diff>=20).sort((x,y)=>y.diff-x.diff);return{shared:shared.slice(0,3),differences:differences.slice(0,3)}}

export const metadata={title:'Compare Fragrances',description:'Compare verified fragrance notes and community similarity votes side by side.',alternates:{canonical:'/compare'},openGraph:{title:'Compare Fragrances | Scentmarked',description:'Compare fragrance notes and community similarity data side by side.',url:'/compare',type:'website'}}

async function loadCompareAliases(s:any){
 const rows:any[]=[]
 const batchSize=500
 for(let start=0;start<20000;start+=batchSize){
  const result=await s.from('perfume_aliases').select('perfume_id,alias,alias_slug').order('perfume_id').order('alias').order('alias_slug').range(start,start+batchSize-1)
  if(result.error)return {data:null,error:result.error}
  const batch=result.data||[]
  rows.push(...batch)
  if(batch.length<batchSize)return {data:rows,error:null}
 }
 return {data:null,error:new Error('Comparison aliases exceed pagination safety limit')}
}

async function loadComparePerfumes(s:any){
 const rows:any[]=[]
 const batchSize=200
 for(let start=0;start<20000;start+=batchSize){
  const result=await s.from('perfumes').select('id,name,slug,image_url,concentration,release_year,brands(name),perfume_notes(position,notes(name)),perfume_accords(strength,source_type,accords(name))').eq('status','published').order('name').order('id').range(start,start+batchSize-1)
  if(result.error)return {data:null,error:result.error}
  const batch=result.data||[]
  rows.push(...batch)
  if(batch.length<batchSize)return {data:rows,error:null}
 }
 return {data:null,error:new Error('Comparison catalog exceeds pagination safety limit')}
}

export default async function Compare({searchParams}:{searchParams:Promise<{a?:string,b?:string}>}){
 const q=await searchParams;
 let perfumes:any[]=[];let aliases:any[]=[];let pageBanner:any=null;let loadError=false;
 try{
  const s=await createClient();
  const [result,content,aliasResult]=await Promise.all([loadComparePerfumes(s),s.from('site_content').select('*').eq('content_key','compare_banner').eq('is_active',true).maybeSingle(),loadCompareAliases(s)]);
  if(aliasResult.error)loadError=true;else aliases=aliasResult.data||[];
  if(result.error)loadError=true;else perfumes=result.data||[];
  if(!content.error&&content.data){const now=Date.now(),x=content.data;if((!x.starts_at||new Date(x.starts_at).getTime()<=now)&&(!x.ends_at||new Date(x.ends_at).getTime()>=now))pageBanner=x}
 }catch{loadError=true}
 perfumes=perfumes.map((p:any)=>({...p,name:publicText(p.name,120),slug:publicText(p.slug,200),image_url:safeUrl(p.image_url),concentration:publicText(p.concentration,80),brands:p.brands?{...p.brands,name:publicText(p.brands.name,120)}:p.brands,perfume_notes:(p.perfume_notes||[]).map((row:any)=>({...row,position:publicText(row.position,40),notes:row.notes?{...row.notes,name:publicText(row.notes.name,80)}:row.notes})).filter((row:any)=>row.notes?.name),perfume_accords:(p.perfume_accords||[]).map((row:any)=>({...row,source_type:publicText(row.source_type,40),accords:row.accords?{...row.accords,name:publicText(row.accords.name,80)}:row.accords})).filter((row:any)=>row.accords?.name)})).filter((p:any)=>p.name&&p.slug)
 if(pageBanner)pageBanner={...pageBanner,image_url:safeUrl(pageBanner.image_url),mobile_image_url:safeUrl(pageBanner.mobile_image_url),subtitle:publicText(pageBanner.subtitle,80),title:publicText(pageBanner.title,140),body:publicText(pageBanner.body,500),cta_url:safeCtaUrl(pageBanner.cta_url),cta_label:publicText(pageBanner.cta_label,80)}
 const canonicalById=new Map(perfumes.map((p:any)=>[p.id,p]));
 const aliasSlugMap=new Map<string,string>();
 const aliasesById=new Map<string,string[]>();
 for(const alias of aliases){const canonical:any=canonicalById.get(alias.perfume_id);if(!canonical)continue;if(typeof alias.alias_slug==='string')aliasSlugMap.set(alias.alias_slug,canonical.slug);if(typeof alias.alias==='string'){const names=aliasesById.get(canonical.id)||[];names.push(publicText(alias.alias,120));aliasesById.set(canonical.id,names)}}
 const resolveSlug=(slug:string)=>aliasSlugMap.get(slug)||slug;
 const requestedA=q.a?perfumes.find(p=>p.slug===resolveSlug(q.a!)):undefined;
 const requestedB=q.b?perfumes.find(p=>p.slug===resolveSlug(q.b!)):undefined;
 const a=requestedA;
 const b=requestedB;
 let retailerIds=new Set<string>();
 if((a||b)&&!loadError){try{const s=await createClient(),ids=[a?.id,b?.id].filter(Boolean);const offers=await s.from('perfume_affiliate_offers').select('perfume_id').in('perfume_id',ids).eq('is_active',true);retailerIds=new Set((offers.data||[]).map((x:any)=>String(x.perfume_id)))}catch{}}
 const invalidSelection=!!((q.a&&!requestedA)||(q.b&&!requestedB));
 const same=!!a&&!!b&&a.id===b.id;
 let community:any[]=[],relationship:any=null,initialSaved=false;
 if(a&&b&&!same&&!loadError){try{const s=await createClient();const [first,second]=[a.id,b.id].sort();const {data:{user}}=await s.auth.getUser();const requests:any[]=[s.from('comparison_votes').select('similarity,sweeter,stronger,longer,more_gourmand').eq('perfume_a_id',first).eq('perfume_b_id',second),s.from('scent_relationships').select('source_perfume_id,target_perfume_id,relationship_type,confidence,evidence_source').or('and(source_perfume_id.eq.'+a.id+',target_perfume_id.eq.'+b.id+'),and(source_perfume_id.eq.'+b.id+',target_perfume_id.eq.'+a.id+')').limit(1)];if(user)requests.push(s.from('saved_comparisons').select('perfume_a_id').eq('user_id',user.id).eq('perfume_a_id',first).eq('perfume_b_id',second).maybeSingle());const [votes,rels,saved]=await Promise.all(requests);community=votes.data||[];relationship=rels.data?.[0]||null;initialSaved=!!saved?.data}catch{}}
 const communityCount=community.length,communityReady=communityCount>=3,avgSimilarity=communityReady?community.reduce((sum:number,v:any)=>sum+Number(v.similarity||0),0)/communityCount:0;
 const attributeConsensus=(key:'sweeter'|'stronger'|'longer'|'more_gourmand')=>{
  const votes=community.map((v:any)=>v[key]).filter((id:any)=>id===a?.id||id===b?.id)
  if(votes.length<3)return null
  const aCount=votes.filter((id:any)=>id===a?.id).length,bCount=votes.length-aCount
  return{votes:votes.length,winner:aCount===bCount?null:aCount>bCount?a:b,aCount,bCount}
 }
 const communityAttributes=[
  ['sweeter','Sweeter'],
  ['stronger','Stronger'],
  ['longer','Longer lasting'],
  ['more_gourmand','More gourmand'],
 ] as const;
 const shared:string[]=a&&b&&!same?Array.from(new Set<string>((names(a) as string[]).filter((x:string)=>(names(b) as string[]).includes(x)))):[];
 const dnaTakeaway=a&&b&&!same?dnaSummary(a,b):{shared:[],differences:[]};
 const catalogScore=a&&b&&!same?catalogSimilarity(a,b):null;
 const card=(p:any)=><div className="compare-profile"><div className="compare-bottle">{p.image_url?<img src={p.image_url} alt={p.name+" by "+(p.brands?.name||"Scentmarked")}/>:<div className="catalog-placeholder"><small>{p.brands?.name||"Scentmarked"}</small><b>{p.name}</b></div>}</div><small>{p.brands?.name}</small><h3>{p.name}</h3><p>{p.concentration||'Fragrance'}{p.release_year?' · '+p.release_year:''}</p><div className="result-actions"><Link className="text-link" href={'/perfume/'+encodeURIComponent(p.slug)}>VIEW PROFILE →</Link>{retailerIds.has(String(p.id))&&<Link className="text-link" href={'/perfume/'+encodeURIComponent(p.slug)+'#where-to-buy'}>WHERE TO BUY →</Link>}</div></div>;

 return <main>{pageBanner&&<section className="admin-card site-content-bg" style={pageBanner.image_url?{'--desktop-bg':`url(${pageBanner.image_url})`,'--mobile-bg':`url(${pageBanner.mobile_image_url||pageBanner.image_url})`,marginBottom:24} as React.CSSProperties: {marginBottom:24}}><p className="eyebrow">{pageBanner.subtitle||"SCENT COMPARISON"}</p>{pageBanner.title&&<h1>{pageBanner.title}</h1>}{pageBanner.body&&<p>{pageBanner.body}</p>}{pageBanner.cta_url&&<Link className="button ghost" href={pageBanner.cta_url}>{pageBanner.cta_label||"Explore"}</Link>}</section>}<section className="compare-page"><p className="eyebrow">SIDE BY SIDE</p><h1 className="page-title">Compare Scents</h1><p className="lede">Compare verified fragrance details without the guesswork.</p>
  {loadError?<div className="empty-state"><h2>Comparison data is temporarily unavailable.</h2><p>Please refresh in a moment.</p></div>:invalidSelection?<div className="empty-state"><h2>That comparison link is no longer available.</h2><p>One of the requested fragrances could not be found in the published catalog.</p><Link className="button" href="/compare">Start a new comparison</Link></div>:perfumes.length<2?<div className="empty-state"><h2>More fragrances are needed to compare.</h2></div>:<>
   <form action="/compare" className="compare-picker searchable-compare"><PerfumeSearchPicker name="a" label="First fragrance" required selectedSlug={a?.slug} options={perfumes.map(p=>({id:p.id,name:p.name,slug:p.slug,brand:p.brands?.name||'Scentmarked',aliases:aliasesById.get(p.id)||[]}))}/><b>⇄</b><PerfumeSearchPicker name="b" label="Second fragrance" required selectedSlug={b?.slug} options={perfumes.map(p=>({id:p.id,name:p.name,slug:p.slug,brand:p.brands?.name||'Scentmarked',aliases:aliasesById.get(p.id)||[]}))}/><button className="button">Compare</button></form>
   {!a||!b?<div className="empty-state">{a||b?<><p className="eyebrow">ONE MORE SCENT</p><h2>{(a||b).brands?.name} {(a||b).name} is ready to compare.</h2><p>Search for a second fragrance above to see verified note overlap, Scent DNA differences, documented relationships, and community similarity.</p><div className="rating-actions"><Link className="button ghost" href={'/matches?perfume='+encodeURIComponent((a||b).slug)}>Find Similar Scents Instead</Link><Link className="text-link" href={'/perfume/'+encodeURIComponent((a||b).slug)}>Back to profile →</Link></div></>:<><h2>Choose two fragrances to compare.</h2><p>Search by perfume or brand above. Only matching fragrances appear while you type.</p></>}</div>:<>{same?<div className="empty-state"><h2>Choose two different fragrances.</h2><p>Select another scent to see a meaningful side-by-side comparison.</p></div>:<><SaveComparison aId={a.id} bId={b.id} initialSaved={initialSaved}/><div className="compare-head">{card(a)}{card(b)}</div>{catalogScore!=null&&<section className="community-consensus"><p className="eyebrow">HOW DIFFERENT ARE THEY?</p><h2>{catalogScore}% catalog similarity</h2><p>{catalogScore>=75?'Their verified note and accord profiles overlap strongly.':catalogScore>=50?'They share meaningful scent DNA, but the profiles also have noticeable differences.':catalogScore>=25?'There is some overlap, but their verified scent profiles are substantially different.':'Their verified note and accord profiles show limited overlap.'}</p><p className="muted">This is a ScentMarked catalog comparison based on verified notes and accord strength—not a clone determination, smell guarantee, or community vote.</p></section>}{relationship&&<section className={'compare-relationship-alert '+(['manufacturer_inspired_by','possible_clone'].includes(relationship.relationship_type)?'warning':'neutral')}><div className="compare-relationship-label">{relationship.relationship_type==='manufacturer_inspired_by'?'INSPIRED-BY ALERT':relationship.relationship_type==='possible_clone'?'POSSIBLE CLONE ALERT':'SCENT RELATIONSHIP'}</div><p className="eyebrow">SCENT RELATIONSHIP</p><h2>{relationship.relationship_type==='manufacturer_inspired_by'?'Documented inspiration':relationship.relationship_type==='possible_clone'?'Possible clone relationship':relationship.relationship_type==='similar_dna'?'Similar scent DNA':relationship.relationship_type==='flanker'?'Same fragrance family':'Known scent comparison'}</h2>{relationship.relationship_type==='manufacturer_inspired_by'?<p><strong>{relationship.source_perfume_id===a.id?a.name:b.name}</strong> is documented as inspired by <strong>{relationship.target_perfume_id===a.id?a.name:b.name}</strong>. Compare the verified scent DNA below before deciding whether you want both in your collection.</p>:relationship.relationship_type==='possible_clone'?<p>ScentMarked has a documented possible-clone relationship between <strong>{a.name}</strong> and <strong>{b.name}</strong>. This is not a claim that they are identical; compare their verified notes, accords, and community reports below.</p>:<p>ScentMarked has a documented relationship between these fragrances. Use the note comparison and community data below to decide whether the overlap matters for your collection.</p>}{relationship.confidence!=null&&<p className="muted">Evidence confidence: {Number(relationship.confidence)}%.</p>}{relationship.evidence_source&&(()=>{try{const u=new URL(String(relationship.evidence_source));return ['http:','https:'].includes(u.protocol)?<p><a className="text-link" href={u.toString()} target="_blank" rel="noreferrer">View relationship evidence ↗</a></p>:<p className="muted">Evidence recorded: {relationship.evidence_source}</p>}catch{return <p className="muted">Evidence recorded: {relationship.evidence_source}</p>}})()}<p className="muted">A documented relationship is separate from the community similarity score and does not by itself mean the fragrances are identical.</p></section>}<div className="shared-notes"><p className="eyebrow">OVERLAP</p><h2>{shared.length} Shared Note{shared.length===1?'':'s'}</h2><div className="note-cloud">{shared.length?shared.map((n:string)=><span key={n}>✦<b>{n}</b></span>):<p>No exact verified notes shared.</p>}</div></div><section className="community-consensus"><p className="eyebrow">SCENT DNA</p><h2>Accord profile</h2><p>Compare the strongest accord families in each fragrance. Strength values describe each scent's own profile and are not manufacturer concentration percentages.</p>{(dnaTakeaway.shared.length>0||dnaTakeaway.differences.length>0)&&<div className="preference-summary"><b>DNA takeaway</b>{dnaTakeaway.shared.length>0&&<span><strong>Strongest overlap:</strong> {dnaTakeaway.shared.map((x:any)=>x.name).join(' · ')}</span>}{dnaTakeaway.differences.map((x:any)=><span key={x.name}><strong>{x.name}:</strong> {x.a>x.b?a.name:b.name} is stronger ({Math.round(Math.max(x.a,x.b))} vs {Math.round(Math.min(x.a,x.b))})</span>)}</div>}<div className="consensus-grid"><article><h3>{a.name}</h3>{dna(a).length?dna(a).slice(0,8).map((x:any)=><div className="dna-row" key={x.accords.name}><div><b>{x.accords.name}</b><span>{Math.round(Number(x.strength))}</span></div><div className="dna-track" role="meter" aria-label={x.accords.name+" strength"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Number(x.strength))}><i style={{width:Math.max(0,Math.min(100,Number(x.strength)))+'%'}}/></div></div>):<p className="muted">Accord data not verified yet.</p>}</article><article><h3>{b.name}</h3>{dna(b).length?dna(b).slice(0,8).map((x:any)=><div className="dna-row" key={x.accords.name}><div><b>{x.accords.name}</b><span>{Math.round(Number(x.strength))}</span></div><div className="dna-track" role="meter" aria-label={x.accords.name+" strength"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Number(x.strength))}><i style={{width:Math.max(0,Math.min(100,Number(x.strength)))+'%'}}/></div></div>):<p className="muted">Accord data not verified yet.</p>}</article></div></section>
    {['top','heart','base'].map(pos=><div className="compare-layer" key={pos}><h2>{pos==='heart'?'Heart':pos[0].toUpperCase()+pos.slice(1)} Notes</h2><div><article><h3>{a.name}</h3>{group(a,pos).length?group(a,pos).map((n:string)=><p key={n}>◆ {n}</p>):<p className="muted">Not verified</p>}</article><article><h3>{b.name}</h3>{group(b,pos).length?group(b,pos).map((n:string)=><p key={n}>◆ {n}</p>):<p className="muted">Not verified</p>}</article></div></div>)}
    <section className="community-consensus"><p className="eyebrow">COMMUNITY COMPARISON</p><h2>{communityReady?'What members are reporting':'Community data is still building'}</h2>{communityReady?<><p><strong>{avgSimilarity.toFixed(1)} / 5</strong> average similarity from {communityCount} votes.</p><p className="muted">This score summarizes members’ direct 1–5 similarity votes.</p><div className="consensus-grid">{communityAttributes.map(([key,label])=>{const result=attributeConsensus(key);return result?<span key={key}><b>{result.winner?result.winner.name:'Split vote'}</b>{label} · {result.votes} votes</span>:null})}</div><p className="muted">Attribute consensus appears after at least 3 members vote on that specific comparison question.</p></>:<p>{communityCount===0?'No comparison votes yet.':communityCount+' vote'+(communityCount===1?'':'s')+' so far.'} Consensus appears after at least 3 member votes.</p>}</section><ComparisonVote aId={a.id} bId={b.id} aName={a.name} bName={b.name}/></>}
   </>}
  </>}
 </section></main>
}
