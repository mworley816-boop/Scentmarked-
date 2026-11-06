import test from 'node:test'
import assert from 'node:assert/strict'
import type {SupabaseClient} from '@supabase/supabase-js'
import {saveAtlasEvidenceDraft} from '../lib/atlas-evidence-draft-writer.ts'
import type {ClaimedTask} from '../lib/atlas-worker-execution.ts'
const task:ClaimedTask={task_id:'task',perfume_id:'perfume',task_kind:'research_description',lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
const input={proposedText:'Research draft',sources:[{url:'https://example.org/source',claim:'Evidence claim'}]}
test('trusted draft writer calls lease-checked RPC, never publishes',async()=>{
 const calls:string[]=[]
 const client={rpc:async(name:string,args:Record<string,unknown>)=>{
  calls.push(name);assert.equal(args.p_lease_token,'lease')
  return {data:'draft-id',error:null}
 }} as unknown as SupabaseClient
 assert.deepEqual(await saveAtlasEvidenceDraft(client,task,input),{status:'draft_requires_review',draftId:'draft-id'})
 assert.deepEqual(calls,['atlas_save_employee_evidence_draft'])
})
test('rejects unsourced drafts before any database write',async()=>{
 const client={rpc:async()=>{throw Error('should not write')}} as unknown as SupabaseClient
 await assert.rejects(()=>saveAtlasEvidenceDraft(client,task,{...input,sources:[]}),/Missing Atlas evidence/)
 await assert.rejects(()=>saveAtlasEvidenceDraft(client,task,{...input,sources:[{url:'http://example.org',claim:'claim'}]}),/HTTPS/)
})
test('rejects image evidence on non-graphics assignments',async()=>{
 const client={rpc:async()=>{throw Error('should not write')}} as unknown as SupabaseClient
 await assert.rejects(()=>saveAtlasEvidenceDraft(client,task,{...input,imageReference:{url:'https://example.org/image',rightsStatus:'unverified'}}),/graphics task/)
})
test('database failure cannot be reported as saved draft',async()=>{
 const client={rpc:async()=>({data:null,error:{message:'lease expired'}})} as unknown as SupabaseClient
 await assert.rejects(()=>saveAtlasEvidenceDraft(client,task,input),/lease expired/)
})
