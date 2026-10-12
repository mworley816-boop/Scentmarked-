import {classifyPerfumeResearchCandidate,type PerfumeResearchCandidate,type ResearchReviewDecision} from './atlas-research-intake.ts'

export type AtlasResearchSubmission = {
 id:string
 candidate:PerfumeResearchCandidate
 decision:Exclude<ResearchReviewDecision,'invalid'>
 submittedAt:string
 reviewedAt:null
 reviewedBy:null
}

export type AtlasResearchIntakeResult =
 | {accepted:false;errors:string[];submission:null}
 | {accepted:true;errors:string[];submission:AtlasResearchSubmission}

export function prepareAtlasResearchSubmission(
 input:unknown,
 existing:ReadonlyArray<{brand:string,name:string}>,
 id:string,
 submittedAt:string
):AtlasResearchIntakeResult {
 const result=classifyPerfumeResearchCandidate(input,existing)
 if(result.decision==='invalid'||!result.candidate)return {accepted:false,errors:result.errors,submission:null}
 if(!id.trim()||!Number.isFinite(Date.parse(submittedAt)))return {accepted:false,errors:['Submission ID and timestamp are required'],submission:null}
 return {accepted:true,errors:result.errors,submission:{
  id:id.trim(),candidate:result.candidate,decision:result.decision,
  submittedAt,reviewedAt:null,reviewedBy:null
 }}
}
