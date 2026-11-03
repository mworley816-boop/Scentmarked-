import test from 'node:test'
import assert from 'node:assert/strict'
import {runOneAtlasAssignment} from '../lib/atlas-worker-execution.ts'
const task={task_id:'t',perfume_id:'p',task_kind:'research_graphic' as const,lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
test('no queued task returns idle',async()=>{
 assert.deepEqual(await runOneAtlasAssignment({claim:async()=>null,perform:async()=>{throw Error('not called')},finish:async()=>{throw Error('not called')}}),{status:'idle'})
})
test('successful graphics research remains awaiting review',async()=>{
 const r=await runOneAtlasAssignment({claim:async()=>task,perform:async()=>({success:true}),finish:async(_task,result)=>{assert.equal(result.success,true);return true}})
 assert.equal(r.status,'awaiting_review')
})
test('lost lease is not reported as successful completion',async()=>{
 const r=await runOneAtlasAssignment({claim:async()=>task,perform:async()=>({success:true}),finish:async()=>false})
 assert.equal(r.status,'lease_lost')
})
test('worker exceptions are reported to queue finisher',async()=>{
 const r=await runOneAtlasAssignment({claim:async()=>task,perform:async()=>{throw Error('research failed')},finish:async(_task,result)=>{assert.equal(result.success,false);assert.equal(result.error,'research failed');return true}})
 assert.equal(r.status,'retry_or_failed')
})
