import {prepareAtlasResearchBatch,type AtlasResearchSourceResult} from './atlas-research-worker.ts'
import type {PerfumeResearchCandidate} from './atlas-research-intake.ts'

export type AtlasBatchSubmissionOutcome={
 submitted:{index:number;id:string;status:string}[]
 failed:{index:number;error:string}[]
 rejected:{index:number;errors:string[]}[]
}

export async function submitAtlasResearchBatch(
 sources:ReadonlyArray<AtlasResearchSourceResult>,
 submit:(candidate:PerfumeResearchCandidate)=>Promise<{id:string;status:string}>
):Promise<AtlasBatchSubmissionOutcome>{
 const prepared=prepareAtlasResearchBatch(sources)
 const submitted:AtlasBatchSubmissionOutcome['submitted']=[]
 const failed:AtlasBatchSubmissionOutcome['failed']=[]
 const rejected=prepared.rejected
 let acceptedIndex=0
 for(const [index,source] of sources.entries()){
  if(rejected.some(item=>item.index===index))continue
  const candidate=prepared.accepted[acceptedIndex++]
  try{
   const result=await submit(candidate)
   if(!result.id||!result.status)throw new Error('Submission returned an invalid response')
   submitted.push({index,id:result.id,status:result.status})
  }catch(error){
   failed.push({index,error:error instanceof Error?error.message:'Submission failed'})
  }
 }
 return {submitted,failed,rejected}
}
