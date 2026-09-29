import { relationshipReason } from '@/lib/scent-relationships'

export function matchReasons(m:any,withBaseline:boolean){
 const reasons:string[]=[]
 if(m.relationship)reasons.push(relationshipReason(m.relationship.relationship_type))
 if(m.loved?.length)reasons.push('Matches '+m.loved.slice(0,3).join(', '))
 if(withBaseline&&m.sharedAccords?.length)reasons.push('Shared DNA: '+m.sharedAccords.slice(0,3).join(', '))
 if(withBaseline&&m.shared?.length)reasons.push('Shared notes: '+m.shared.slice(0,3).join(', '))
 if(m.traitScore!=null&&m.traitScore>=70)reasons.push('Strong wear-profile fit')
 return reasons.slice(0,3)
}

type RecoveryOptions={selectedSlug?:string;love:string[];avoid:string[];sweetness:number;projection:number;longevity:number;maxPrice:number}

export function buildMatchRecoveryHref(options:RecoveryOptions,remove:'love'|'avoid'|'budget',index?:number){
 const {selectedSlug,love,avoid,sweetness,projection,longevity,maxPrice}=options,q=new URLSearchParams()
 if(selectedSlug)q.set('perfume',selectedSlug)
 const keptLove=remove==='love'&&index!=null?love.filter((_,i)=>i!==index):love
 if(keptLove.length)q.set('love',keptLove.join(', '))
 const keptAvoid=remove==='avoid'&&index!=null?avoid.filter((_,i)=>i!==index):remove==='avoid'?[]:avoid
 if(keptAvoid.length)q.set('avoid',keptAvoid.join(', '))
 if(sweetness>0)q.set('sweetness',String(sweetness))
 if(projection>0)q.set('projection',String(projection))
 if(longevity>0)q.set('longevity',String(longevity))
 if(remove!=='budget'&&maxPrice>0)q.set('maxPrice',String(maxPrice))
 return '/matches?'+q.toString()
}
