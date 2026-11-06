import type {SupabaseClient} from '@supabase/supabase-js'
import type {ClaimedTask} from './atlas-worker-execution.ts'

// Trusted server-side storage only. No public route, approval, or publication.
export type AtlasEvidenceDraftInput={
 proposedText:string
 sources:Array<{url:string;claim:string}>
 imageReference?:{url:string;rightsStatus:'unverified'|'verified'}
}
export async function saveAtlasEvidenceDraft(client:SupabaseClient,task:ClaimedTask,input:AtlasEvidenceDraftInput){
 if(!task.task_id||!task.perfume_id||!task.lease_token)throw new Error('Invalid Atlas task')
 if(!input.proposedText?.trim()||!Array.isArray(input.sources)||input.sources.length===0)throw new Error('Missing Atlas evidence')
 for(const source of input.sources){
  if(!source?.claim?.trim())throw new Error('Missing evidence claim')
  let parsed:URL
  try{parsed=new URL(source.url)}catch{throw new Error('Invalid evidence URL')}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new Error('Evidence URL must use HTTPS')
 }
 if(input.imageReference&&task.task_kind!=='research_graphic'&&task.task_kind!=='verify_image_rights')throw new Error('Image evidence requires graphics task')
 if(input.imageReference){
  let parsed:URL
  try{parsed=new URL(input.imageReference.url)}catch{throw new Error('Invalid image evidence URL')}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new Error('Image evidence must use HTTPS')
  if(!['unverified','verified'].includes(input.imageReference.rightsStatus))throw new Error('Invalid rights status')
 }
 // The DB RPC verifies the active lease and task identity atomically before writing.
 const {data,error}=await client.rpc('atlas_save_employee_evidence_draft',{
  p_task_id:task.task_id,p_lease_token:task.lease_token,
  p_proposed_text:input.proposedText,p_sources:input.sources,
  p_image_reference:input.imageReference?{url:input.imageReference.url}:null,
  p_rights_status:input.imageReference?.rightsStatus??null
 })
 if(error)throw new Error('Atlas draft save failed: '+error.message)
 if(typeof data!=='string'||!data)throw new Error('Atlas draft save was not confirmed')
 return {status:'draft_requires_review' as const,draftId:data}
}
