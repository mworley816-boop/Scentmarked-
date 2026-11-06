import type {AtlasTaskKind} from './atlas-worker-execution.ts'

// Research-only evidence contract. Never write these findings to published catalog
// fields or place graphics without a separate, explicitly authorized review flow.
export type AtlasResearchEvidence={
 perfumeId:string
 taskKind:AtlasTaskKind
 proposedText:string
 sources:Array<{url:string;claim:string}>
 imageReference?:{url:string;rightsStatus:'unverified'|'verified'}
}

export function validateAtlasResearchEvidence(value:AtlasResearchEvidence){
 if(!value||typeof value.perfumeId!=='string'||!value.perfumeId.trim())throw new Error('Missing perfume ID')
 if(!['research_description','verify_notes','verify_sources','research_graphic','verify_image_rights'].includes(value.taskKind))throw new Error('Invalid research task kind')
 if(typeof value.proposedText!=='string'||!value.proposedText.trim())throw new Error('Missing proposed research text')
 if(!Array.isArray(value.sources)||value.sources.length===0)throw new Error('Research must include sources')
 for(const source of value.sources){
  if(!source||typeof source.url!=='string'||typeof source.claim!=='string'||!source.claim.trim())throw new Error('Invalid research citation')
  let url:URL
  try{url=new URL(source.url)}catch{throw new Error('Invalid research source URL')}
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password)throw new Error('Research sources must use public HTTPS URLs')
 }
 if(value.imageReference){
  const image=value.imageReference
  if(value.taskKind!=='research_graphic'&&value.taskKind!=='verify_image_rights')throw new Error('Image references require graphics review')
  let url:URL
  try{url=new URL(image.url)}catch{throw new Error('Invalid image reference URL')}
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Image references must use HTTPS')
  if(image.rightsStatus!=='unverified'&&image.rightsStatus!=='verified')throw new Error('Invalid image rights status')
 }
 return {status:'draft_requires_review' as const, evidence:value}
}
