import type { MatchCandidate } from '@/lib/match-scoring'
import { relationshipReason } from '@/lib/scent-relationships'

export function matchReasons(m:MatchCandidate,withBaseline:boolean){
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
 // Explicit empty values override saved profile defaults when a filter is removed.
 q.set('love',keptLove.join(', '))
 const keptAvoid=remove==='avoid'&&index!=null?avoid.filter((_,i)=>i!==index):remove==='avoid'?[]:avoid
 q.set('avoid',keptAvoid.join(', '))
 q.set('sweetness',sweetness>0?String(sweetness):'')
 q.set('projection',projection>0?String(projection):'')
 q.set('longevity',longevity>0?String(longevity):'')
 q.set('maxPrice',remove!=='budget'&&maxPrice>0?String(maxPrice):'')
 return '/matches?'+q.toString()
}

export function buildMatchCompareHref(candidateSlug:string,selectedSlug?:string){
 const q=new URLSearchParams({a:selectedSlug||candidateSlug})
 if(selectedSlug)q.set('b',candidateSlug)
 return '/compare?'+q.toString()
}
