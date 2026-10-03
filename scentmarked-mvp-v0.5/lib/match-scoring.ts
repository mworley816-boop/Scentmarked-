export type MatchBrand={name?:string|null}
export type MatchNoteRow={position?:string|null;notes?:{name?:string|null}|null}
export type MatchAccordRow={strength?:number|string|null;accords?:{name?:string|null}|null}
export type MatchRating={sweetness?:number|string|null;projection?:number|string|null;longevity?:number|string|null}
export type MatchPerfume={id:string;name:string;slug:string;image_url?:string|null;price_low?:number|null;price_high?:number|null;gender_marketing?:string|null;brands?:MatchBrand|null;perfume_notes:MatchNoteRow[];perfume_accords:MatchAccordRow[];ratings?:MatchRating[]}

export const noteNames=(p:MatchPerfume)=>(p.perfume_notes||[]).map(x=>x.notes?.name).filter((name):name is string=>Boolean(name))
const positionWeight=(p?:string|null)=>p==='base'?1.25:p==='heart'?1.15:p==='top'?1.05:1
const noteMap=(p:MatchPerfume)=>{const m=new Map<string,{position:string;weight:number}>();for(const x of p?.perfume_notes||[]){const name=x.notes?.name;if(!name)continue;const w=positionWeight(x.position),old=m.get(name);if(!old||w>old.weight)m.set(name,{position:x.position||'unspecified',weight:w})}return m}
export const accordRows=(p:MatchPerfume)=>(p?.perfume_accords||[]).filter(x=>x.accords?.name&&Number(x.strength)>0)
export const preferenceTerms=(p:MatchPerfume)=>{const notes=noteNames(p).map(name=>({name,kind:'note',strength:100})),accords=accordRows(p).map(x=>({name:String(x.accords?.name),kind:'accord',strength:Number(x.strength)||0}));return [...notes,...accords]}

function noteScore(a:MatchPerfume,b:MatchPerfume,f:Map<string,number>,total:number){const A=noteMap(a),B=noteMap(b),shared=[...A.keys()].filter(x=>B.has(x)),rarity=(n:string)=>Math.log(1+total/(f.get(n)||1)),sharedWeight=(n:string)=>{const x=A.get(n)!,y=B.get(n)!,positionBonus=x.position===y.position&&x.position!=='unspecified'?1.18:1;return rarity(n)*Math.min(x.weight,y.weight)*positionBonus},sw=shared.reduce((s,n)=>s+sharedWeight(n),0),union=[...new Set([...A.keys(),...B.keys()])],uw=union.reduce((s,n)=>s+rarity(n)*Math.max(A.get(n)?.weight||0,B.get(n)?.weight||0),0),similarity=uw?Math.min(100,sw/uw*100):0,coverage=Math.min(1,Math.min(A.size,B.size)/6),positionMatches=shared.filter(n=>A.get(n)?.position===B.get(n)?.position&&A.get(n)?.position!=='unspecified');return{value:similarity*(.72+.28*coverage),shared,positionMatches,coverage}}
function accordScore(a:MatchPerfume,b:MatchPerfume){const A=new Map(accordRows(a).map(x=>[String(x.accords?.name),Number(x.strength)] as [string,number])),B=new Map(accordRows(b).map(x=>[String(x.accords?.name),Number(x.strength)] as [string,number])),names=[...new Set([...A.keys(),...B.keys()])];if(!A.size||!B.size)return null;let diff=0;for(const n of names)diff+=Math.abs((A.get(n)||0)-(B.get(n)||0));const value=Math.max(0,100-diff/Math.max(1,names.length));return{value,shared:[...A.keys()].filter(n=>B.has(n))}}

export function scentSimilarityScore(a:MatchPerfume,b:MatchPerfume,f:Map<string,number>,total:number){const n=noteScore(a,b,f,total),ac=accordScore(a,b);const value=ac?n.value*.65+ac.value*.35:n.value;const coverage=Math.min(1,(n.coverage+(ac?Math.min(1,Math.min(accordRows(a).length,accordRows(b).length)/4):0))/(ac?2:1));return{score:Math.round(value),shared:n.shared,positionMatches:n.positionMatches,sharedAccords:ac?.shared||[],usesAccords:!!ac,confidence:coverage>=.85?'High':coverage>=.5?'Medium':'Limited'}}


export type MatchPreferences={love:string[];avoid:string[];sweetness:number;projection:number;longevity:number;maxPrice:number;presentations?:string[];favoritePerfumes?:MatchPerfume[]}
export type MatchRelationship={relationship_type:string;confidence?:number|null;evidence_source?:string|null}
export type MatchCandidate=MatchPerfume&{dnaScore:number;score:number;scoreWeights:{dna:number;preferences:number;wear:number};shared:string[];positionMatches:string[];sharedAccords:string[];usesAccords:boolean;confidence:string;loved:string[];lovedAccords:string[];avoided:string[];preferenceScore:number;traitScore:number|null;sweet:number|null;proj:number|null;long:number|null;price:number;priceKnown:boolean;priceOk:boolean;relationship?:MatchRelationship}

export function buildMatchCandidate(p:MatchPerfume,selected:MatchPerfume|undefined,freq:Map<string,number>,total:number,preferences:MatchPreferences,relationship?:MatchRelationship):MatchCandidate{
 const {love,avoid,sweetness,projection,longevity,maxPrice}=preferences,presentations=preferences.presentations||[],favoritePerfumes=preferences.favoritePerfumes||[],loveLower=love.map(x=>x.toLowerCase()),avoidLower=avoid.map(x=>x.toLowerCase()),base=selected?scentSimilarityScore(selected,p,freq,total):{score:0,shared:[],positionMatches:[],sharedAccords:[],usesAccords:false,confidence:'Limited'},terms=preferenceTerms(p),loved=love.filter((_,i)=>terms.some(t=>t.name.toLowerCase().includes(loveLower[i]))),lovedAccords=love.filter((_,i)=>terms.some(t=>t.kind==='accord'&&t.name.toLowerCase().includes(loveLower[i]))),avoided=avoid.filter((_,i)=>terms.some(t=>t.name.toLowerCase().includes(avoidLower[i]))),preferenceScore=love.length?Math.round(love.reduce((sum,_,i)=>{const hits=terms.filter(t=>t.name.toLowerCase().includes(loveLower[i]));if(!hits.length)return sum;const best=Math.max(...hits.map(t=>t.kind==='accord'?Math.max(35,t.strength):100));return sum+best},0)/love.length):0,avg=(key:string)=>{const vals=(p.ratings||[]).map(r=>Number(r[key as keyof MatchRating])).filter((v:number)=>Number.isFinite(v)&&v>=1&&v<=5);return vals.length?vals.reduce((a:number,b:number)=>a+b,0)/vals.length:null},sweet=avg('sweetness'),proj=avg('projection'),long=avg('longevity'),traits=([[sweet,sweetness],[proj,projection],[long,longevity]] as Array<[number|null,number]>).filter((x):x is [number,number]=>x[0]!=null&&x[1]>0),traitScore=traits.length?traits.reduce((sum,x)=>sum+Math.max(0,100-Math.abs(x[0]-x[1])*25),0)/traits.length:null,presentationKeys=presentations.map(x=>x.toLowerCase()),presentation=String(p.gender_marketing||'').toLowerCase(),presentationMatched=presentationKeys.length>0&&!presentationKeys.includes('no preference')&&presentationKeys.some(x=>x.startsWith('feminine')?/(women|female|feminine)/.test(presentation):x.startsWith('masculine')?/(men|male|masculine)/.test(presentation):x.startsWith('unisex')?/(unisex|gender-neutral|gender neutral)/.test(presentation):false),favoriteScores=favoritePerfumes.filter(x=>x.id!==p.id).map(x=>scentSimilarityScore(x,p,freq,total).score).sort((a,b)=>b-a),favoriteTasteScore=favoriteScores.length?Math.round(favoriteScores.slice(0,3).reduce((a,b)=>a+b,0)/Math.min(3,favoriteScores.length)):null,dnaWeight=selected?(love.length>0||traitScore!=null?.45:1):0,preferenceWeight=love.length>0?(selected?.35:.65):0,wearWeight=traitScore!=null?(selected?.20:love.length>0?.35:1):0,parts:Array<[number,number]>=[]
 if(selected)parts.push([base.score,dnaWeight]);if(love.length)parts.push([preferenceScore,preferenceWeight]);if(traitScore!=null)parts.push([traitScore,wearWeight]);if(favoriteTasteScore!=null)parts.push([favoriteTasteScore,selected?.25:.35])
 const weight=parts.reduce((s,x)=>s+x[1],0),combined=weight?Math.round(parts.reduce((s,x)=>s+x[0]*x[1],0)/weight):0,scoreWeights={dna:weight?dnaWeight/weight:0,preferences:weight?preferenceWeight/weight:0,wear:weight?wearWeight/weight:0},price=Number(p.price_low||p.price_high||0),priceKnown=price>0,priceOk=!maxPrice||!priceKnown||price<=maxPrice
 return {...p,...base,dnaScore:base.score,score:Math.min(100,combined+(presentationMatched?4:0)),scoreWeights,loved,lovedAccords,avoided,preferenceScore,traitScore,sweet,proj,long,price,priceKnown,priceOk,relationship}
}

export type RecommendationFeedback='more_like_this'|'less_like_this'
export const feedbackAdjustment=(feedback?:RecommendationFeedback|null)=>feedback==='more_like_this'?5:feedback==='less_like_this'?-5:0

export type PersonalRecommendationSignal={rating?:number|null;favorite?:boolean;owned?:boolean;want?:boolean;tried?:boolean}
export function personalSignalAdjustment(signal?:PersonalRecommendationSignal|null){
 if(!signal)return 0
 let adjustment=0
 if(signal.favorite)adjustment+=2
 else if(signal.owned)adjustment+=1
 if(signal.rating!=null&&Number.isFinite(signal.rating))adjustment+=signal.rating>=4?2:signal.rating<=2?-2:0
 if(signal.want)adjustment+=1
 if(signal.tried&&signal.rating==null&&!signal.favorite&&!signal.owned)adjustment+=0
 return Math.max(-3,Math.min(3,adjustment))
}

export function rankMatchCandidates(candidates:MatchCandidate[],limit=12,feedbackByPerfume:Record<string,RecommendationFeedback>={},personalSignals:Record<string,PersonalRecommendationSignal>={}){
 let avoidExcluded=0,budgetExcluded=0
 const eligible=candidates.filter(candidate=>{
  if(candidate.avoided.length>0){avoidExcluded+=1;return false}
  if(candidate.priceKnown&&!candidate.priceOk){budgetExcluded+=1;return false}
  return true
 })
 eligible.sort((a,b)=>{
  const scoreDifference=(b.score+feedbackAdjustment(feedbackByPerfume[b.id])+personalSignalAdjustment(personalSignals[b.id]))-(a.score+feedbackAdjustment(feedbackByPerfume[a.id])+personalSignalAdjustment(personalSignals[a.id]))
  if(scoreDifference!==0)return scoreDifference
  const lovedDifference=b.loved.length-a.loved.length
  if(lovedDifference!==0)return lovedDifference
  return a.name.localeCompare(b.name)
 })
 return{avoidExcluded,budgetExcluded,eligibleMatchCount:eligible.length,matches:eligible.slice(0,limit)}
}
