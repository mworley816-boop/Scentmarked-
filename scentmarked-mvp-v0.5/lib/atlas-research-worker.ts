import {validatePerfumeResearchCandidate,type PerfumeResearchCandidate} from './atlas-research-intake.ts'

export type AtlasResearchSourceResult={
 brand:string
 name:string
 manufacturerUrl:string
 sourceNotes:unknown
}
export type AtlasResearchBatchResult={
 accepted:PerfumeResearchCandidate[]
 rejected:{index:number;errors:string[]}[]
}

export function prepareAtlasResearchBatch(
 sources:ReadonlyArray<AtlasResearchSourceResult>,
 maxBatchSize=25
):AtlasResearchBatchResult{
 if(!Number.isInteger(maxBatchSize)||maxBatchSize<1||maxBatchSize>100)throw new Error('Invalid batch limit')
 if(sources.length>maxBatchSize)throw new Error('Research batch exceeds size limit')
 const accepted:PerfumeResearchCandidate[]=[]
 const rejected:{index:number;errors:string[]}[]=[]
 for(const [index,source] of sources.entries()){
  const result=validatePerfumeResearchCandidate(source)
  if(result.valid&&result.normalized)accepted.push(result.normalized)
  else rejected.push({index,errors:result.errors})
 }
 return {accepted,rejected}
}
