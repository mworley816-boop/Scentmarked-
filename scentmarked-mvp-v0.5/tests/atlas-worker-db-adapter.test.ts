import test from 'node:test'
import assert from 'node:assert/strict'
import {runAtlasDatabaseWorker} from '../lib/atlas-worker-db-adapter.ts'
import type {SupabaseClient} from '@supabase/supabase-js'
const task={task_id:'task',perfume_id:'perfume',task_kind:'research_graphic',lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
test('adapter claims, processes and acknowledges graphics without publishing',async()=>{
 const calls:string[]=[]
 const client={rpc:async(name:string,args:Record<string,unknown>)=>{
  calls.push(name)
  if(name==='atlas_claim_employee_task')return {data:[task],error:null}
  assert.equal(args.p_lease_token,'lease')
  return {data:true,error:null}
 }} as unknown as SupabaseClient
 const result=await runAtlasDatabaseWorker(client,async()=>({success:true}))
 assert.equal(result.status,'awaiting_review')
 assert.deepEqual(calls,['atlas_claim_employee_task','atlas_finish_employee_task'])
})
test('adapter returns idle without a claim',async()=>{
 const client={rpc:async()=>({data:[],error:null})} as unknown as SupabaseClient
 assert.equal((await runAtlasDatabaseWorker(client,async()=>{throw Error('unexpected')})).status,'idle')
})
test('adapter rejects database claim errors',async()=>{
 const client={rpc:async()=>({data:null,error:{message:'missing migration'}})} as unknown as SupabaseClient
 await assert.rejects(()=>runAtlasDatabaseWorker(client,async()=>({success:true})),/claim failed/)
})
