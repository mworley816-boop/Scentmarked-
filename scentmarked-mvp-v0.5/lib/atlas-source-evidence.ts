import type {PerfumeResearchCandidate} from './atlas-research-intake.ts'

export type AtlasSourceEvidence={
 manufacturerUrl:string
 observedUrl:string
 pageTitle:string
 fetchedAt:string
}
export type AtlasSourceAssessment={
 verified:boolean
 reasons:string[]
 evidence:AtlasSourceEvidence
}

// Evidence validation does not prove that a website belongs to a manufacturer.
// A reviewer must independently establish manufacturer ownership.
export function assessAtlasSourceEvidence(candidate:PerfumeResearchCandidate,evidence:AtlasSourceEvidence):AtlasSourceAssessment{
 const reasons:string[]=[]
 if(evidence.manufacturerUrl!==candidate.manufacturerUrl)reasons.push('Evidence source URL does not match candidate')
 let submitted:URL|null=null
 let observed:URL|null=null
 try{submitted=new URL(candidate.manufacturerUrl)}catch{}
 try{observed=new URL(evidence.observedUrl)}catch{}
 if(!submitted||submitted.protocol!=='https:'||submitted.username||submitted.password||submitted.port)reasons.push('Submitted source URL is not a safe HTTPS URL')
 if(!observed||observed.protocol!=='https:'||observed.username||observed.password||observed.port)reasons.push('Observed source URL is not a safe HTTPS URL')
 if(submitted&&observed&&submitted.hostname.toLowerCase()!==observed.hostname.toLowerCase())reasons.push('Observed source host differs from submitted source')
 if(!evidence.pageTitle.trim())reasons.push('Page title is missing')
 const timestamp=Date.parse(evidence.fetchedAt)
 if(!Number.isFinite(timestamp)||timestamp>Date.now()+60_000||timestamp<Date.now()-1000*60*60*24*365)reasons.push('Evidence timestamp is invalid')
 return {verified:reasons.length===0,reasons,evidence}
}
