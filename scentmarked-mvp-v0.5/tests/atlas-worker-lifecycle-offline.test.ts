import test from 'node:test'
import assert from 'node:assert/strict'
import {runOneAtlasAssignment,type ClaimedTask} from '../lib/atlas-worker-execution.ts'

function offlineQueue(kind:ClaimedTask['task_kind'],failures=0){
 let state:'queued'|'running'|'awaiting_review'|'completed'|'failed'='queued'
 let attempts=0
 let lease='';let published=false
 const task:ClaimedTask={task_id:'offline-task',perfume_id:'offline-perfume',task_kind:kind,lease_token:'',leased_until:'2099-01-01T00:00:00Z'}
 const deps={
  claim:async()=>{
   if(state!=='queued'||attempts>=5)return null
   attempts++;state='running';lease='lease-'+attempts
   return {...task,lease_token:lease}
  },
  perform:async()=>{
   if(attempts<=failures)throw new Error('offline provider unavailable')
   return {success:true}
  },
  finish:async(claimed:ClaimedTask,result:{success:boolean})=>{
   if(state!=='running'||claimed.lease_token!==lease)return false
   state=result.success?(kind==='research_graphic'||kind==='verify_image_rights'?'awaiting_review':'completed'):(attempts>=5?'failed':'queued')
   return true
  }
 }
 return {deps,snapshot:()=>({state,attempts,published})}
}
test('offline research assignment retries and then completes',async()=>{
 const q=offlineQueue('verify_sources',2)
 assert.equal((await runOneAtlasAssignment(q.deps)).status,'retry_or_failed')
 assert.equal((await runOneAtlasAssignment(q.deps)).status,'retry_or_failed')
 assert.equal((await runOneAtlasAssignment(q.deps)).status,'completed')
 assert.deepEqual(q.snapshot(),{state:'completed',attempts:3,published:false})
})
test('offline graphics assignment cannot publish or skip review',async()=>{
 const q=offlineQueue('research_graphic')
 assert.equal((await runOneAtlasAssignment(q.deps)).status,'awaiting_review')
 assert.deepEqual(q.snapshot(),{state:'awaiting_review',attempts:1,published:false})
 assert.equal((await runOneAtlasAssignment(q.deps)).status,'idle')
})
test('offline repeated provider failures stop after maximum attempts',async()=>{
 const q=offlineQueue('verify_notes',10)
 for(let i=0;i<5;i++)assert.equal((await runOneAtlasAssignment(q.deps)).status,'retry_or_failed')
 assert.deepEqual(q.snapshot(),{state:'failed',attempts:5,published:false})
 assert.equal((await runOneAtlasAssignment(q.deps)).status,'idle')
})
