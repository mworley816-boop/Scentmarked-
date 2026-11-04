import type {SupabaseClient} from '@supabase/supabase-js'
import {runOneAtlasAssignment,type AtlasWorkerResult,type ClaimedTask} from './atlas-worker-execution.ts'

// Trusted server only. Caller must independently authorize the operation and
// provide a service-role Supabase client. No browser/API route or scheduler is exposed.
export async function runAtlasDatabaseWorker(
 client:SupabaseClient,
 perform:(task:ClaimedTask)=>Promise<AtlasWorkerResult>
){
 return runOneAtlasAssignment({
  claim:async()=>{
   const {data,error}=await client.rpc('atlas_claim_employee_task',{p_lease_seconds:300})
   if(error)throw new Error('Atlas task claim failed: '+error.message)
   if(!Array.isArray(data))throw new Error('Invalid Atlas claim response')
   if(data.length===0)return null
   if(data.length!==1)throw new Error('Unexpected Atlas claim count')
   const task=data[0] as ClaimedTask
   if(!task||!task.task_id||!task.perfume_id||!task.lease_token||!task.task_kind)throw new Error('Invalid Atlas claim payload')
   return task
  },
  perform,
  finish:async(task,result)=>{
   const {data,error}=await client.rpc('atlas_finish_employee_task',{
    p_task_id:task.task_id,p_lease_token:task.lease_token,
    p_success:result.success,p_error:result.error||null
   })
   if(error)throw new Error('Atlas task finish failed: '+error.message)
   return data===true
  }
 })
}
