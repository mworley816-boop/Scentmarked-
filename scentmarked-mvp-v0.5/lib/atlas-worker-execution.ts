// Service-side Atlas execution contract. This module does not start workers,
// grant authorization, publish records or generate/place images.
export type AtlasTaskKind='research_description'|'verify_notes'|'verify_sources'|'research_graphic'|'verify_image_rights'
export type ClaimedTask={task_id:string;perfume_id:string;task_kind:AtlasTaskKind;lease_token:string;leased_until:string}
export type AtlasWorkerResult={success:boolean;error?:string}
export type AtlasWorkerDependencies={
 claim:()=>Promise<ClaimedTask|null>
 perform:(task:ClaimedTask)=>Promise<AtlasWorkerResult>
 finish:(task:ClaimedTask,result:AtlasWorkerResult)=>Promise<boolean>
}
const graphics=new Set<AtlasTaskKind>(['research_graphic','verify_image_rights'])
export async function runOneAtlasAssignment(deps:AtlasWorkerDependencies){
 const task=await deps.claim()
 if(!task)return {status:'idle' as const}
 if(!task.task_id||!task.lease_token||!task.perfume_id)throw new Error('Invalid Atlas task lease')
 let result:AtlasWorkerResult
 try{
  result=await deps.perform(task)
  if(!result||typeof result.success!=='boolean')result={success:false,error:'Invalid worker result'}
 }catch(error){
  result={success:false,error:error instanceof Error?error.message:'Worker execution failed'}
 }
 const acknowledged=await deps.finish(task,result)
 if(!acknowledged)return {status:'lease_lost' as const,taskId:task.task_id}
 return {status:result.success?(graphics.has(task.task_kind)?'awaiting_review' as const:'completed' as const):'retry_or_failed' as const,taskId:task.task_id}
}
